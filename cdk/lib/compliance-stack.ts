import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as bedrock from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock";
import { BedrockFoundationModel } from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock/models";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as path from "path";
import { readFileSync } from "fs";

export interface ComplianceStackProps extends cdk.StackProps {
  readonly policiesDir?: string;
}

export class ComplianceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComplianceStackProps = {}) {
    const env = { region: "us-east-1", ...props.env };
    super(scope, id, { ...props, env });

    const policiesDir = props.policiesDir ?? path.join(__dirname, "..", "policies");

    const table = new dynamodb.Table(this, "ComplianceData", {
      tableName: "compliance-data",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const toolsFn = new lambda.Function(this, "ComplianceTools", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda", "tools")),
      timeout: cdk.Duration.seconds(30),
      environment: { TABLE_NAME: table.tableName },
    });
    table.grantReadData(toolsFn);

    const agent = new bedrock.Agent(this, "ComplianceAgent", {
      name: "gtm-compliance-agent",
      foundationModel: BedrockFoundationModel.ANTHROPIC_CLAUDE_SONNET_V1_0,
      instruction: readFileSync(path.join(__dirname, "..", "resources", "agent-instructions.md"), "utf-8"),
      shouldPrepareAgent: true,
      idleSessionTTL: cdk.Duration.minutes(15),
    });

    agent.addActionGroup(
      new bedrock.AgentActionGroup(this, "ComplianceToolsActionGroup", {
        actionGroupName: "ComplianceTools",
        description: "Verify product master data, market rules, customer rules, and certificate validity.",
        actionGroupState: "ENABLED",
        actionGroupExecutor: { lambda: toolsFn },
        apiSchema: bedrock.ApiSchema.fromAsset(path.join(__dirname, "..", "resources", "openapi.json")),
      })
    );

    const policiesBucket = new s3.Bucket(this, "PoliciesBucket", {
      bucketName: `gtm-compliance-policies-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const kb = new bedrock.KnowledgeBase(this, "PoliciesKB", {
      name: "gtm-compliance-policies",
      description: "Regulatory summaries (REACH, GPSR) and customer-specific compliance policies.",
      embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
    });

    new bedrock.S3DataSource(this, "PoliciesDataSource", {
      bucket: policiesBucket,
      knowledgeBase: kb,
      dataSourceName: "policies",
      chunkingStrategy: bedrock.ChunkingStrategy.FIXED_SIZE,
    });

    agent.addKnowledgeBase(kb);

    const alias = new bedrock.AgentAlias(this, "AgentAlias", {
      agentId: agent.agentId,
      aliasName: "live",
    });

    const apiFn = new lambda.Function(this, "AgentApiProxy", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambda", "api-proxy")),
      timeout: cdk.Duration.minutes(2),
      environment: {
        AGENT_ID: agent.agentId,
        AGENT_ALIAS_ID: alias.aliasId,
      },
    });
    apiFn.addToRolePolicy(
      new cdk.aws_iam.PolicyStatement({
        actions: ["bedrock:InvokeAgent", "bedrock:InvokeModel"],
        resources: ["*"],
      })
    );

    const httpApi = new apigw.HttpApi(this, "ComplianceHttpApi", {
      apiName: "gtm-compliance-api",
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.OPTIONS],
        allowOrigins: ["*"],
      },
    });

    httpApi.addRoutes({
      path: "/check",
      methods: [apigw.HttpMethod.POST],
      integration: new HttpLambdaIntegration("ComplianceIntegration", apiFn),
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: `${httpApi.apiEndpoint}/check`,
      description: "POST endpoint for compliance checks against the Bedrock agent",
    });

    this.exportValue(policiesBucket.bucketName);
  }
}

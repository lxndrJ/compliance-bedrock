#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ComplianceStack } from "../lib/compliance-stack";

const app = new cdk.App();
new ComplianceStack(app, "GtmComplianceStack", {
  env: {
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});

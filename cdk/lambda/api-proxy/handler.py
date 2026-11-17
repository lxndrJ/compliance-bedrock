import json
import os

import boto3

agent_client = boto3.client("bedrock-agent-runtime")


def handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        product_id = body.get("productId")
        country = body.get("country")
        customer = body.get("customer")
        if not all(isinstance(v, str) and v for v in (product_id, country, customer)):
            return _response(400, {"error": "productId, country and customer are required strings"})

        prompt = (
            f"Can I launch product {product_id} in {country} for {customer}? "
            "Verify country rules, customer rules, and certificates with your tools, "
            "then return the structured compliance decision."
        )

        res = agent_client.invoke_agent(
            agentId=os.environ["AGENT_ID"],
            agentAliasId=os.environ["AGENT_ALIAS_ID"],
            sessionId=f"session-{product_id}-{country}-{customer}",
            inputText=prompt,
        )

        chunks = []
        for evt in res.get("completion", []):
            chunk = evt.get("chunk", {})
            if "bytes" in chunk:
                chunks.append(chunk["bytes"].decode("utf-8"))
        return _response(200, {"answer": "".join(chunks)})
    except Exception as exc:
        return _response(500, {"error": str(exc)})


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body),
    }

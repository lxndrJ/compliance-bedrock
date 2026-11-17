import json
import os
from datetime import date, datetime

import boto3

table = boto3.resource("dynamodb").Table(os.environ.get("TABLE_NAME", "compliance-data"))


def _get(pk: str):
    res = table.get_item(Key={"PK": pk})
    return res.get("Item")


def _find(prefix: str, key: str, value: str):
    res = table.query(KeyConditionExpression=boto3.dynamodb.conditions.Key("PK").begins_with(prefix))
    for item in res.get("Items", []):
        if str(item.get(key, "")).upper() == value.upper():
            return item
    return None


def get_product(product_id: str):
    pid = product_id.strip().upper()
    if not pid.startswith("PRODUCT#"):
        pid = "PRODUCT#" + pid
    item = _get(pid)
    if item is None:
        item = _find("PRODUCT#", "id", product_id)
    if item is None:
        return {"statusCode": 404, "body": json.dumps({"error": f"Product {product_id} not found"})}
    supplier = _get(item.get("supplierId", ""))
    body = {
        "id": item.get("id"),
        "name": item.get("name"),
        "supplier": supplier.get("name") if supplier else item.get("supplierId"),
        "supplierAudit": supplier.get("audit") if supplier else None,
        "certificates": item.get("certificates", []),
    }
    return {"statusCode": 200, "body": json.dumps(body)}


def get_country_rules(country: str):
    item = _find("COUNTRY#", "country", country)
    if item is None:
        return {"statusCode": 404, "body": json.dumps({"error": f"No rule set for country {country}"})}
    return {
        "statusCode": 200,
        "body": json.dumps({"country": item.get("country"), "required": item.get("requiredRules", [])}),
    }


def get_customer_rules(customer: str):
    item = _find("CUSTOMER#", "name", customer)
    if item is None:
        return {"statusCode": 404, "body": json.dumps({"error": f"No rule set for customer {customer}"})}
    return {
        "statusCode": 200,
        "body": json.dumps({
            "customer": item.get("name"),
            "required": item.get("requiredCerts", []),
            "supplierAuditRequired": item.get("supplierAuditRequired", False),
        }),
    }


def check_certificates(product_id: str):
    item = _get("PRODUCT#" + product_id.strip().upper().replace("PRODUCT#", ""))
    if item is None:
        return {"statusCode": 404, "body": json.dumps({"error": f"Product {product_id} not found"})}
    today = date.today()
    results = []
    for cert in item.get("certificates", []):
        expires = datetime.strptime(cert["expiresAt"], "%Y-%m-%d").date()
        results.append({
            "type": cert["type"],
            "issuer": cert.get("issuer"),
            "expiresAt": cert["expiresAt"],
            "valid": expires >= today,
            "daysRemaining": (expires - today).days,
        })
    return {"statusCode": 200, "body": json.dumps({"productId": item.get("id"), "certificates": results})}


def handler(event, context):
    route = event.get("function") or event.get("path", "")
    params = event.get("parameters") or []
    qp = {p["name"]: p["value"] for p in params if p.get("in") == "query"}
    path_params = {p["name"]: p["value"] for p in params if p.get("in") == "path"}

    if route == "get_product":
        return get_product(path_params.get("product_id", qp.get("product_id", "")))
    if route == "get_country_rules":
        return get_country_rules(path_params.get("country", qp.get("country", "")))
    if route == "get_customer_rules":
        return get_customer_rules(path_params.get("customer", qp.get("customer", "")))
    if route == "check_certificates":
        return check_certificates(qp.get("product_id", path_params.get("product_id", "")))

    return {"statusCode": 400, "body": json.dumps({"error": f"Unknown function {route}"})}

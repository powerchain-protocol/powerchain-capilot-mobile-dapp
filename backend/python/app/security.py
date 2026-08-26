from __future__ import annotations

import hashlib
import ipaddress
import json
import re
import socket
from urllib.parse import urlparse
from typing import Any

MAX_ARGUMENT_BYTES = 32 * 1024
MAX_RESULT_BYTES = 256 * 1024
MAX_SCHEMA_BYTES = 48 * 1024
MAX_DESCRIPTION_CHARS = 2000
_CREDENTIAL = re.compile(r"api[_-]?key|secret|password|passwd|token|authorization|cookie|private[_-]?key|seed|mnemonic", re.I)


def assert_safe_url(raw: str, allowed_hosts: set[str] | frozenset[str], production: bool) -> None:
    parsed = urlparse(raw)
    if production and parsed.scheme != "https":
        raise ValueError("Production MCP servers must use HTTPS")
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Unsupported MCP URL protocol")
    if parsed.username or parsed.password:
        raise ValueError("MCP URL must not contain credentials")
    if not parsed.hostname or parsed.hostname not in allowed_hosts:
        raise ValueError("MCP hostname is not allowlisted")
    for info in socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM):
        address = ipaddress.ip_address(info[4][0])
        if address.is_private or address.is_loopback or address.is_link_local or address.is_multicast or address.is_reserved or address.is_unspecified:
            raise ValueError("MCP hostname resolves to a private or reserved address")


def normalize_description(value: Any) -> str:
    text = re.sub(r"[\x00-\x1f\x7f]", " ", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text[:MAX_DESCRIPTION_CHARS]


def assert_schema_size(schema: Any) -> None:
    if len(json.dumps(schema or {}, separators=(",", ":")).encode()) > MAX_SCHEMA_BYTES:
        raise ValueError("MCP tool schema exceeds size limit")


def assert_arguments_safe(arguments: dict[str, Any]) -> None:
    encoded = json.dumps(arguments, separators=(",", ":")).encode()
    if len(encoded) > MAX_ARGUMENT_BYTES:
        raise ValueError("MCP arguments exceed size limit")

    def walk(value: Any) -> None:
        if isinstance(value, dict):
            for key, child in value.items():
                if _CREDENTIAL.search(str(key)):
                    raise ValueError(f"Credential-like argument field is blocked: {key}")
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(arguments)


def normalize_result(value: Any) -> tuple[str, str]:
    text = value if isinstance(value, str) else json.dumps(value, default=str, separators=(",", ":"))
    encoded = text.encode()
    if len(encoded) > MAX_RESULT_BYTES:
        raise ValueError("MCP result exceeds size limit")
    return text, hashlib.sha256(encoded).hexdigest()

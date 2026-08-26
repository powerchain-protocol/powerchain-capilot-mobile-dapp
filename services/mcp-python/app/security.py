import ipaddress, json, re, socket
from urllib.parse import urlparse
SECRET_KEY = re.compile(r"(^|_)(password|passwd|secret|private[_-]?key|seed|mnemonic|api[_-]?key|authorization|auth[_-]?token|access[_-]?token|refresh[_-]?token|session|cookie)($|_)", re.I)
def assert_safe_arguments(value, max_bytes: int):
    if len(json.dumps(value or {}).encode()) > max_bytes: raise ValueError("MCP arguments exceed egress limit")
    def visit(node, path=()):
        if isinstance(node, dict):
            for key, child in node.items():
                if SECRET_KEY.search(key): raise ValueError(f"blocked credential-like field: {'.'.join((*path,key))}")
                visit(child, (*path,key))
        elif isinstance(node, list):
            for i, child in enumerate(node): visit(child, (*path,str(i)))
    visit(value)
def assert_url_allowed(url: str, allowed_hosts: set[str], production: bool):
    parsed=urlparse(url)
    if parsed.hostname not in allowed_hosts: raise ValueError("MCP hostname not allowlisted")
    if parsed.username or parsed.password: raise ValueError("MCP URL may not contain credentials")
    if production and parsed.scheme != "https": raise ValueError("production MCP requires HTTPS")
    if production:
        for info in socket.getaddrinfo(parsed.hostname, parsed.port or 443, type=socket.SOCK_STREAM):
            ip=ipaddress.ip_address(info[4][0])
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved: raise ValueError("MCP hostname resolves to private/reserved IP")

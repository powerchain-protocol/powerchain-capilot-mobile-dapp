import unittest
from unittest.mock import patch

from app.config import load_settings
from app.security import assert_arguments_safe, assert_safe_url, normalize_description


class SecurityTests(unittest.TestCase):
    def test_production_requires_non_empty_allowed_tools(self):
        env = {
            "NODE_ENV": "production",
            "MCP_SERVERS_JSON": '[{"id":"energy","url":"https://mcp.example.com","allowedTools":[]}]',
        }
        with self.assertRaises(ValueError):
            load_settings(env)


    def test_production_requires_explicit_hostname_allowlist(self):
        env = {
            "NODE_ENV": "production",
            "MCP_SERVERS_JSON": '[{"id":"energy","url":"https://mcp.example.com","allowedTools":["search_assets"]}]',
        }
        with self.assertRaises(ValueError):
            load_settings(env)
        env["MCP_ALLOWED_HOSTS"] = "mcp.example.com"
        self.assertEqual(load_settings(env).servers[0].id, "energy")

    def test_credential_fields_are_blocked(self):
        with self.assertRaises(ValueError):
            assert_arguments_safe({"query": "ok", "apiKey": "secret"})
        assert_arguments_safe({"query": "ok"})

    @patch("app.security.socket.getaddrinfo")
    def test_private_dns_resolution_is_rejected(self, mock_lookup):
        mock_lookup.return_value = [(2, 1, 6, "", ("127.0.0.1", 443))]
        with self.assertRaises(ValueError):
            assert_safe_url("https://mcp.example.com", {"mcp.example.com"}, True)
        self.assertEqual(normalize_description(" hello\n world "), "hello world")


if __name__ == "__main__":
    unittest.main()

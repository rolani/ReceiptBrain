"""call_recommend must use Structured Outputs (json_schema), not bare json_object."""

from __future__ import annotations

import inspect

from app import openai_client


def test_recommend_json_schema_shape() -> None:
    schema = openai_client._recommend_json_schema()
    assert schema["name"] == "Recommendations"
    assert schema["schema"]["required"] == ["items"]
    item_props = schema["schema"]["properties"]["items"]["items"]["properties"]
    assert "type" in item_props
    assert "confidence" in item_props


def test_call_recommend_uses_json_schema_not_json_object() -> None:
    """json_object mode errors unless messages mention 'json'; json_schema does not."""
    src = inspect.getsource(openai_client.call_recommend)
    assert '"type": "json_object"' not in src
    assert '"type": "json_schema"' in src
    assert "_recommend_json_schema()" in src

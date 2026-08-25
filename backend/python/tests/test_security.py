import pytest
from app.security import assert_safe_arguments

def test_blocks_api_key():
    with pytest.raises(ValueError): assert_safe_arguments({"api_key":"x"},8192)
def test_allows_normal_args(): assert_safe_arguments({"assetId":"A-1"},8192)
def test_size_limit():
    with pytest.raises(ValueError): assert_safe_arguments({"q":"x"*9000},8192)

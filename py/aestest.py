import asyncio
import base64
import hashlib
import json
import logging
import math
import re
import secrets
import ssl
import time
from typing import Any
from urllib.parse import quote_plus
import asyncio
import sys

#CONTENT_TYPE = 'Content-Type'
#COOKIE = 'Cookie'
#SET_COOKIE = 'Set-Cookie'

from Crypto.Cipher import PKCS1_v1_5
from Crypto.PublicKey import RSA
import aiohttp
from aiohttp.hdrs import CONTENT_TYPE
from aiohttp.hdrs import COOKIE
from aiohttp.hdrs import SET_COOKIE
import async_timeout
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.primitives.ciphers import Cipher
from cryptography.hazmat.primitives.ciphers import algorithms
from cryptography.hazmat.primitives.ciphers import modes

#import sys    
#print("In module products sys.path[0], __package__ ==", sys.path[0], __package__)

from const import DEFAULT_TIMEOUT_ERROR_RETRIES
from const import DEFAULT_TIMEOUT_SECONDS
from exceptions import EmptyDataException
from exceptions import ForbiddenException
from exceptions import LoginForbiddenException
from exceptions import LoginInvalidException
from exceptions import TimeoutException
from exceptions import UnexpectedApiException
import requests


def aes_encrypt(plaintext: bytes) -> bytes:
    """
    AES-CBC encrypt with PKCS #7 padding. This matches the AES options on TP-Link routers.
    :param key: The AES key
    :param iv: The AES IV
    :param plaintext: Data to encrypt
    :return: Ciphertext
    """
    key = 1728043569335086;
    iv = 1728043569335086;
    aes_key_bytes = str(key).encode("utf-8")
    aes_iv_bytes = str(iv).encode("utf-8")
    print("algorithms.AES.block_size-----------------------------------", algorithms.AES.block_size)
    padder = padding.PKCS7(algorithms.AES.block_size).padder()
    print("algorithms.AES.block_size befor pad-----------------------------------", plaintext.decode(), plaintext.hex(),'------------------------')
    plaintext_bytes: bytes = padder.update(plaintext) + padder.finalize()
    print("algorithms.AES.block_size after pad-----------------------------------", plaintext_bytes.hex(),'------------------------')
    cipher = Cipher(algorithms.AES(aes_key_bytes), modes.CBC(aes_iv_bytes))
    encryptorDBGRM = cipher.encryptor()
    dbgrm =encryptorDBGRM.update(plaintext_bytes)
    print("!! AFTER update 1-----------------------------------", dbgrm.hex(),'------------------------')
    print("!! AFTER update 2-----------------------------------", encryptorDBGRM.finalize().hex(),'------------------------')

    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext_bytes) + encryptor.finalize()
    return ciphertext

print('encrypt test got ',aes_encrypt('test'.encode()).hex())


url = "http://192.168.0.1/cgi-bin/luci/;stok=/login?form=login"
res = requests.post(url,{
    'sign':'08c32d6ecb150e31492f82ac380d459551ecb2a726431936c7b840d071341c1029f061a4cdbb5886a29b86f518cd80759fa5040afedd53fb75c495a6e9d815771918fcf3d21566af46d652c180b23f02ec5cede084976910c3ab4cde15add67cdf3b00dd113a0e485507e8ed28e1817ff26b67da96b0c492914c243e3d12d0c1',
    'data':'F+II1cekqDa28GWHuWgJKTgRMnAlYD5j+O61tWPvCsJ5L6GKczi9Q/7NJOxQP6ea1VY+llTAY1+9iX9VeW8jmV0SEEIa3WmDZstlxv9BqyMv3+lU/VxNG2SxehMTPsurNTYiReHY5CsWr+XgB9G8Dk0UTNnVi7LZGYMDZOqcxL0K7bTBHSs9kDQLXov4Y4erw45dMoyjjNrsU21i/U54rssQ5ZK1KQ0eA9JPXhZEjJ438cB3DtSqPLte3aZNfCeuf1s/aLVIyeXKj3ssBFnw98cSKPQm7WHxBMYslBtbboW+diBJryhDBNiOzCK8QUHkj8/YFUzK/Ozt++baEaJ79PgiIpr/2vGBts+StO8tRWd+/1lzvCvXFvrKFr+3gmFYPAHwaQWxEV7S7jQdgxllHQ=='})
print(res.text)

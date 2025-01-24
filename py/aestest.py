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
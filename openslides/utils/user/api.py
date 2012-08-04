#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
    openslides.utils.user.api
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Usefull functions for the OpenSlides user api.

    :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
    :license: GNU GPL, see LICENSE for more details.
"""

from openslides.utils.user.signals import receiv_users

class Users(object):
    """
    A Storage for a multiplicity of different User-Objects.
    """
    def __init__(self, user_prefix=None, id=None):
        self.user_prefix = user_prefix
        self.id = id

    def __iter__(self):
        for receiver, users in receiv_users.send(
                sender='users', user_prefix=self.user_prefix, id=self.id):
            for user in users:
                yield user

    def __getitem__(self, key):
        user_list = list(self)
        return user_list[key]


def generate_uid(prefix, id):
    if ':' in prefix:
        raise ValueError("':' is not allowed in a the 'user_prefix'")
    return "%s:%d" % (prefix, id)


def split_uid(uid):
    data = uid.split(':', 1)
    if len(data) == 2 and data[0] and data[1]:
        return data
    raise TypeError("Invalid uid: '%s'" % uid)


def get_user(uid):
    try:
        user_prefix, id = split_uid(uid)
    except TypeError:
        return EmtyUser()

    return Users(user_prefix=user_prefix, id=id)[0]

#!/bin/env python3

import orcid

SECRET = "5cb52f9f-5440-4484-a3cf-5be318156d31"
CLIENT_ID = "APP-HSVBPMCVF7TAVNRZ"

api = orcid.MemberAPI(CLIENT_ID, SECRET, sandbox=True)

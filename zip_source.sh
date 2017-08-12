#!/bin/bash
find . | grep -v 'git' | grep -v 'zip' | grep -ve 'xx' | zip source -@

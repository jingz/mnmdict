#!/bin/bash
rm source.zip
find . | grep -v 'git' | grep -v 'zip' | grep -ve 'xx' | zip source -@

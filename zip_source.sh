#!/bin/bash
rm source.zip
find . | grep -v 'git' | grep -v 'zip' | grep -ve 'xx' | grep -ve 'jquery.bt.min.js' | grep -ve 'jquery-2' | grep -ve 'active_record.js' | grep -ve 'wordlist' | zip source -@

# Session token stays in browser storage

bmcd returns the session token in the authenticate JSON, so this UI cannot set an httpOnly cookie. The token stays in browser storage. A production content security policy is the mitigation against script theft, instead of a cookie the BMC API does not issue.

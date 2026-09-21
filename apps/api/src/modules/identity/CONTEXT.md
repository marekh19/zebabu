# Identity

Identity registers and authenticates Users and manages their Sessions.

## Language

**User**:
The person registered with Zebabu and identified by a verified email address.
_Avoid_: Account, customer

**Session**:
An authenticated period for one User. Sessions expire and can be revoked.
_Avoid_: Login, token

**API Key**:
A User-owned credential for headless access. It has a read or write scope, expires, and can be revoked without ending a Session.
_Avoid_: Session, token

**Email Verification**:
Proof that a User controls their registered email address. A User must verify it before signing in.

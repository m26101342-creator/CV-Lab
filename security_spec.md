# Security Specification
## Invariants
1. A user can only access and modify their own orders.
2. Only an admin can change an order's status from 'pending' to 'approved' or 'rejected'.
3. A user cannot grant themselves the 'admin' role.
4. Emails written to the `mail` collection must only be addressed to `suportecvlab@gmail.com`.

## Dirty Dozen Payloads
1. User creates profile with `role: 'admin'`. (Fail)
2. User updates profile to `role: 'admin'`. (Fail)
3. User reads another user's profile. (Fail)
4. User creates an order for another user (`ownerId != request.auth.uid`). (Fail)
5. User reads another user's order. (Fail)
6. User updates their own order status to `approved`. (Fail)
7. User updates their order while status is `approved`. (Fail)
8. Admin updates an order's status to `approved`. (Pass)
9. User queues a mail to a non-admin email address. (Fail)
10. Unauthenticated user attempts to create an order. (Fail)
11. User deletes an order. (Fail)
12. Creating an order missing `status`. (Fail)

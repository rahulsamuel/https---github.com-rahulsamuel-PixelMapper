/*
# Remove public update access to LED products

1. Summary
- The LED product table had a policy that let anyone using the public key edit any product.
- This migration removes that policy so only signed-in admins (and the product's creator) can edit products.

2. Changed objects
- `led_products`: dropped policy `update_led_products_anon`.
- `led_products`: revoked UPDATE privilege from the `anon` role.

3. Security
- Remaining UPDATE access: "Admins can update any LED product" and "Users can update own LED products", both for `authenticated` only.
- No data is changed or deleted.

4. Notes
- Product saves from the admin edit form now run under the signed-in admin's session, which satisfies the admin policy.
*/

DROP POLICY IF EXISTS "update_led_products_anon" ON led_products;

REVOKE UPDATE ON led_products FROM anon;

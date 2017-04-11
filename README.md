This is a small tool to delete expired scheduled content from contentful.
It provides two commands:

1. **outdated-entries** to delete entries with an expiry date in the past
2. **orphaned-assets** to delete orphaned assets not linked to an entry

**Important**: This is a development version, use at your own risk.

# Installation

* Install node >= 7.6
* run npm install

# How to run

## Deleting outdated entries

```
node index.js outdated-entries <space-id> <auth-token> <expiry-field> [-g <grace-period>] [--dry-run]
```

* **expiry-filed** The name of field containing the expiration date of the entry.
* **grace-period** Number of days deleted entries haven’t been updated. This makes sure that we don’t delete entries that have just been created.
* **--dry-run** Don’t delete anything but list what would have been deleted.

## Deleting orphaned assets

```
node index.js orphaned-assets <space-id> <auth-token> [-g <grace-period>] [--dry-run]
```

* **expiry-filed** The name of field containing the expiration date of the entry.
* **grace-period** Number of days deleted entries haven’t been updated. This makes sure that we don’t delete entries that have just been created.
* **--dry-run** Don’t delete anything but list what would have been deleted.

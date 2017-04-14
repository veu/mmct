MMCT
==============================

Unofficial toolset for contentful space management.

## Installation

* Install node >= 7.6
* run `npm install -g https://github.com/veu/mmct`

## Usage

### Trimming scheduled content

The following commands help deleting expired scheduled content from contentful.
Add an expiry date to your content model and remove entries from the space once they expire.

#### Delete outdated entries

Deletes all entries with an expiry date in the past and entries linked in expired entries and not anywhere else.

```
mmct-trim outdated-entries <space-id> <auth-token> <expiry-field> [--grace-period <grace-period>] [--dry-run]
```

* **expiry-field** The name of the field containing the expiration date of the entry.
* **grace-period** Keep all entries that have been updated within the last `<grace-period>` days. Default: 5
* **--dry-run** Don’t delete anything but list what would have been deleted.

#### Delete orphaned assets

Deletes all assets that are not linked in any entries. Best used after the previous command.

```
mmct-trim orphaned-assets <space-id> <auth-token> [--grace-period <grace-period>] [--dry-run]
```

* **grace-period** Keep all entries that have been updated within the last `<grace-period>` days. Default: 5
* **--dry-run** Don’t delete anything but list what would have been deleted.

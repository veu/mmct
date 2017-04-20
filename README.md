MMCT
==============================

Toolset for [contentful](https://www.contentful.com/) space management.

## Installation

* Install node >= 7.6
* run `npm install -g https://github.com/veu/mmct`

## Usage

### Trimming scheduled content

The following commands delete expired scheduled content from contentful.
Add an expiry date to your content model and remove entries from the space once they expire.

#### Delete outdated entries

Deletes all entries with an expiry date in the past and entries linked in expired entries and not anywhere else.

```
mmct-trim outdated-entries <space-id> <auth-token> <expiry-field> [--grace-period <days>] [--dry-run]
```

* **expiry-field** The name of the field containing the expiration date of the entry.
* **--grace-period** Keep all entries that have been updated within the last `<days>`. Default: 5
* **--dry-run** Don’t delete anything but list what would have been deleted.

#### Delete orphaned assets

Deletes all assets that are not linked in any entries. Best used after the previous command.

```
mmct-trim orphaned-assets <space-id> <auth-token> [--grace-period <days>] [--dry-run]
```

* **--grace-period** Keep all entries that have been updated within the last `<days>`. Default: 5
* **--dry-run** Don’t delete anything but list what would have been deleted.

### Filling entries

The following commands enter data for multiple entries at once.

#### Fill default value

Added a text field to a content model and need to update existing entries?
Use this command to add a value for all entries of the model that are missing the field.
If the field is localized, all language versions will be set to the same value.

Previously published entries without pending changes will be published again after updating.

```
echo -n "value" | mmct-fill default-value <space-id> <auth-token> <content-model-id> <field>
```

* **content-model-id** Content model ID of the entries to update.
* **field** Name of the field to fill.

### Copying

The following commands copy data for multiple entries at once.

#### Copy value

Copies the text value in the source field to the destination field for all entries of the model.

Previously published entries without pending changes will be published again after updating.

```
mmct-copy value <space-id> <auth-token> <content-model-id> <src-field> <dest-field>
```

* **content-model-id** Content model ID of the entries to update.
* **src-field** Name of the field to copy the value.
* **dest-field** Name of the field to paste the value.

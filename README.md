# Distributed IDs

This is a proof of concept code for verifying distributed identities
using OpenPGP keys.

It works like Keybase but instead of a trusted third party all
necessary data is stored inside the OpenPGP User ID and self
signature notation data packets.

See `rules.json` file for an executable description of how the
identites are verified.

See `samples` directory for a pre-parsed User IDs and notations.

You can try the samples by using:

```
$ cat samples/activitypub-identity.json | node index.js
Key: 653909a2f0e37c106f5faf546c8857e0d8e8f074
  ✓ acct:wiktor@mastodon.social
```

Verification of real keys:

```
$ gpg --export D8E8F074 | node index.js
```

## Identities

This is a description of how the User ID should be formatted and which
signature notation should it have to be verified.

Note that to add these User IDs an additional flag: `--allow-freeform-uid`
needs to be passed to `gpg` to disable default UID checks.

Notations can be added using `notation` subcommand of `--edit-key` after
selecting appropriate User ID.

### GitHub

User ID: `https://github.com/name`

Notation key: `proofs+github@metacode.biz`

Notation value: gist ID that contains the text `[Verifying my OpenPGP key: openpgp4fpr:fingerprint]`.

Example: https://gist.github.com/wiktor-k/389d589dd19250e1f9a42bc3d5d40c16

### HackerNews

User ID: `https://news.ycombinator.com/user?id=name`

Notations not needed.

Example: https://news.ycombinator.com/user?id=fasd

### Reddit

User ID: `https://reddit.com/user/name`

Notation key: proofs+reddit@metacode.biz

Notation value: ID of the comment on KeybaseProofs subreddit that contains the fingerprint prefixed with `"fingerprint": "` (Keybase by default adds this).

Example: https://www.reddit.com/r/KeybaseProofs/comments/2d28r8/my_keybase_proof_redditfaragon_keybasefaragon/

### Twitter

User Id: `https://twitter.com/name`

Notation key: `proofs+twitter@metacode.biz`

Notation value: ID of the status that contains the text `[Verifying my OpenPGP key: openpgp4fpr:fingerprint]`.

Example: https://twitter.com/Valodim/status/592675006880022529

**Note that verification of this ID requires putting Twitter's OAuth token in `rules.json`**

### Bitcoin Transaction Timestamp

This check verifies that the key existed prior to given transaction.

User ID: any, only fingerprint is checked

Notation key: `timestamp+bitcoin-transaction@metacode.biz`

Notation value: Bitcoin transaction ID in hex that contains the fingerprint in one of the outputs (using `OP_RETURN`).

Example: https://blockexplorer.com/tx/afcb092c5ca6409526d18ae9cf22d3b55d37e723eb1b74e3f84f7e6b052a162a

### Domain name

This check verifies control over given web site using Keybase's well-known file.

User ID: any, only fingerprint is checked

Notation key: `proofs+domain@metacode.biz`

Notation value: Domain name to check, it should contain a `/.well-known/keybase.txt` file that contains the fingerprint prefixed with `"fingerprint": "` (Keybase by default adds this).

Example: https://metacode.biz/.well-known/keybase.txt

### Mastodon/ActivityPub account

This will check for an extended property `OpenPGP` that has a value of full lowercase fingerprint (can be configured in Mastodon settings).

User ID: `acct` URI scheme, as used in WebFinger, e.g. `acct:wiktor@mastodon.social`

Notations not needed.

Example: https://mastodon.social/@wiktor

### DNS binding

This check verifies if there is a `TXT` record with contents `openpgp4fpr:fingerprint`.

User ID: `dns` URI scheme, e.g. `dns:metacode.biz`

Notations not needed.

Example: https://dns.google.com/resolve?name=metacode.biz&type=TXT

## Prior art

This design is largely based on [Linked Identities for OpenPGP][LID] draft with just
a few differences:

  - instead of using private/experimental User Attributes this proposal uses URI-formatted
    User IDs and, for additional data, self-signature notations.
    UIDs and notations can be manually inserted using just `gpg`, additionally
    they have a good fallback (if a program does not support validation
    it will still show the link to user's profile page),
  - specifies rules of validation in executable, stack-based language so that any
    implementations of this design can reuse the same validation rules.

## Known issues

There are several issues with the current design that need to be addresses:

  - it could be better if notations specified full URLs to proofs (e.g. gist
    URLs) instead of bare identifiers,
  - some proofs have additional metadata, e.g. Bitcoin Timestamp could print
    the date of the stamp,
  - some rules re-use what keybase already defines.

[LID]: https://tools.ietf.org/html/draft-vb-openpgp-linked-ids-01

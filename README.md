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

    cat samples/reddit-identity.json | npx distributed-ids

Verification of real keys:

    gpg --export D8E8F074 | npx distributed-ids

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

Notation key: proofs+hn@metacode.biz

Notation value: user name on Hacker News

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

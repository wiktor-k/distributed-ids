const openpgp = require('openpgp');
const https = require('https');
const rules = require('./rules.json');
const url = require('url');

function readStdinToBuffer() {
  return new Promise((resolve, reject) => {
    const data = [];
    process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
        data.push(chunk)
    }
    });

    process.stdin.on('end', () => {
      const buffer = Buffer.from.apply(Buffer, data);
      resolve(buffer);
    });

    process.stdin.on('error', e => reject(e));
  });
};

function parseKey(buffer) {
  const key = openpgp.key.read(buffer).keys[0];
  const fingerprint = Buffer.from(key.primaryKey.fingerprint).toString('hex');
  const userIds = [];
  for (const user of key.users) {
    const userId = user.userId.userid;
    const notations = { }
    for (const cert of user.selfCertifications) {
        Object.assign(notations, cert.notation);
    }
    userIds.push({
        userId,
        notations
    });
  }
  return {
      fingerprint,
      userIds
  };
}

async function verifyIdentifies() {
  const good = '\x1b[32;1m✓\x1b[0m';
  const bad = '\x1b[31;1m✗\x1b[0m';
  const key = await readStdinToBuffer();
  const identities = key[0] === '{'.charCodeAt(0) ? JSON.parse(key.toString('utf-8')) : parseKey(key);
  console.log(`Key: ${identities.fingerprint}`);
  for (const identity of identities.userIds) {
    for (const notationKey in identity.notations) {
      const matches = findMatches(identity.userId, notationKey);
      for (const match of matches) {
        const success = await runTopVerification(match.verification, {
        VALUE: identity.notations[notationKey],
        FINGERPRINT: identities.fingerprint,
        USERID: identity.userId
        });
        console.log(`  ${success ? good : bad } ${identity.userId}`);
      }
    }
  }
}

function findMatches(userId, notationKey) {
    const matches = [];
    for (const rule of rules) {
        if (rule.notation === notationKey) {
              matches.push(rule);
          }
    }
    return matches;
}

function fetchResource(url_, bearer) {
  return new Promise((resolve, reject) => {
      const options = url.parse(url_);
      options.headers = {'User-Agent': 'Distributed IDs verification client'};
      if (bearer) {
          options.headers.Authorization = 'Bearer ' + bearer;
      }
    var req = https.request(options, function(res) {
        res.setEncoding('utf8');
        let data = '';
        if (res.statusCode !== 200) {
            reject('Response: ' + res.statusCode);
        }
        res.on('data', d => data += d);
        res.on('end', () => resolve(data));
    });
    req.end();

    req.on('error', e => reject(e));
  });
}

async function runTopVerification(script, bindings) {
    try {
        return await runVerification(script, bindings, []);
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function runVerification(script, bindings, stack) {
    const ops = {
        async fetch(type, bearer) {
            const url = stack.pop();
            let content = await fetchResource(url, bearer);
            if (type === 'json') {
                stack.push(JSON.parse(content));
            } else if (type === 'text') {
                stack.push(content);
            } else {
                throw new Error('Unexpected type: ' + type);
            }
        },
        extract(path) {
            if (!Array.isArray(path)) {
                path = [ path ];
            }
            let object = stack.pop();
            for (const element of path) {
                object = object[element]
            }
            stack.push(object);
        },
        async any(script) {
            let result = false;
            let values = stack.pop();
            if (!Array.isArray(values)) {
                values = Object.values(values);
            }
            for (const element of values) {
                if (await runVerification(script, bindings, [ element ])) {
                    result = true;
                }
            }
            stack.push(result);
        },
        equals() {
            const value1 = stack.pop();
            const value2 = stack.pop();
            stack.push(value1 === value2);
        },
        concat() {
            const value1 = stack.pop();
            const value2 = stack.pop();
            stack.push(value2 + value1);
        },
        load(binding) {
            stack.push(bindings[binding]);
        },
        verify() {
            const value = stack.pop();
            if (value !== true) {
                throw new Error('Verification error');
            }
        },
        duplicate() {
            const value = stack.pop();
            stack.push(value);
            stack.push(value);
        },
        contains() {
            const fragment = stack.pop();
            const content = stack.pop();
            stack.push(content.includes(fragment));
        },
        swap() {
            const value1 = stack.pop();
            const value2 = stack.pop();
            stack.push(value1);
            stack.push(value2);
        }
    }
    for (const instruction of script) {
        if (typeof instruction !== 'object') {
            stack.push(instruction);
            continue;
        }
        await (ops[instruction[0]] || function() {
            throw new Error('Unknown instruction: ' + instruction[0]);
        }).apply(null, instruction.slice(1));
    }
    return stack.pop() === true;
}

verifyIdentifies().catch(console.error.bind(console));

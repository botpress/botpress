# temp-write [![Build Status](https://travis-ci.org/sindresorhus/temp-write.svg?branch=master)](https://travis-ci.org/sindresorhus/temp-write)

> Write string/buffer/stream to a random temp file


## Install

```
$ npm install temp-write
```


## Usage

```js
const fs = require('fs');
const tempWrite = require('temp-write');

const filepath = tempWrite.sync('unicorn');
//=> '/var/folders/_1/tk89k8215ts0rg0kmb096nj80000gn/T/4049f192-43e7-43b2-98d9-094e6760861b'

fs.readFileSync(filepath, 'utf8');
//=> 'unicorn'


tempWrite.sync('unicorn', 'pony.png');
//=> '/var/folders/_1/tk89k8215ts0rg0kmb096nj80000gn/T/4049f192-43e7-43b2-98d9-094e6760861b/pony.png'

tempWrite.sync('unicorn', 'rainbow/cake/pony.png');
//=> '/var/folders/_1/tk89k8215ts0rg0kmb096nj80000gn/T/4049f192-43e7-43b2-98d9-094e6760861b/rainbow/cake/pony.png'
```


## API

### tempWrite(input, [filepath])

Returns a `Promise` for the filepath of the temp file.

### tempWrite.sync(input, [filepath])

Returns the filepath of the temp file.

#### input

Type: `string` `Buffer` `stream.Readable`

Data to write to the temp file. Streams are supported only with the async API.

#### filepath

Type: `string`<br>
Example: `'img.png'` `'foo/bar/baz.png'`

Optionally supply a filepath which is appended to the random path.


## Related

- [tempy](https://github.com/sindresorhus/tempy) - Get a random temporary file or directory path


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)

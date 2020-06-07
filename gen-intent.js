function concatArr(a, b) {
  let result = [ ]

  for (let c of a) {
    for (let d of b) {
      result.push(c + ' ' + d)
    }
  }

  return result
}

let base = [
  'book {event}',
  'schedule {event}',
]

let after = [
  'after {afterDate}',
  'after {afterTime}',
  'after {afterDate} at {afterTime}'
]

let by = [
  'by {byDate}',
  'by {byTime}',
  'by {byDate} at {byTime}',
  'before {byDate}',
  'before {byTime}',
  'before {byDate} at {byTime}'
]

let forTime = [
  'for {forDate}',
  'for {forTime}',
  'for {forDate} at {forTime}',
  'on {forDate}',
  'on {forTime}',
  'on {forDate} at {forTime}'
]

let forLength = [
  'for {length}'
]

let until = [
  'until {untilTime}'
]

let byAfter = concatArr(by, after)
let afterBy = concatArr(after, by)

let finished = base
  .concat(concatArr(base, forTime))
  .concat(concatArr(concatArr(base, forTime), forLength))
  .concat(concatArr(concatArr(base, forTime), until))
  .concat(concatArr(base, after))
  .concat(concatArr(base, by))
  .concat(concatArr(base, afterBy))
  .concat(concatArr(base, byAfter))
  .concat(concatArr(concatArr(base, after), forLength))
  .concat(concatArr(concatArr(base, by), forLength))
  .concat(concatArr(concatArr(base, forLength), after))
  .concat(concatArr(concatArr(base, forLength), by))
  .concat(concatArr(concatArr(base, afterBy), forLength))
  .concat(concatArr(concatArr(base, byAfter), forLength))
  .concat(concatArr(concatArr(base, forLength), afterBy))
  .concat(concatArr(concatArr(base, forLength), byAfter))

for (let f of finished) {
  console.log(f)
}

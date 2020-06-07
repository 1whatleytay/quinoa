const Alexa = require('ask-sdk-core')
const axios = require('axios')
const moment = require('moment')

const endpoint = 'http://24.226.115.5:12300'

function intent(i, body) {
  return {
    canHandle(input) {
      return input.requestEnvelope.request.type === 'IntentRequest'
        && input.requestEnvelope.request.intent.name === i
    },

    handle(input) {
      return body(input)
    }
  }
}

async function getSuggestion(action, after, by) {
  // return {
  //   tag: 'school',
  //   start_date: '2020-06-07 04:00:00',
  //   length: '1:00:00',
  //   repeats: 'none'
  // }

  const data = (await axios.get(endpoint + '/suggest', {
    params: {
      action,
      after,
      by,
    }
  })).data

  if (data instanceof String) {
    console.error(data)
  }

  return data
}

async function giveSuggestion(tag, startDate, length, repeats, accepted) {
  // return true

  const data = (await axios.post(endpoint + '/suggest', { }, {
    params: {
      tag,
      start_date: startDate,
      length,
      repeats,
      accepted
    }
  })).data

  if (data !== 'OK') {
    console.error(data)
  }

  return data === 'OK'
}

async function getSchedule() {
  // return {
  //   events: [
  //     {
  //       action: 'Birthday',
  //       start_date: '2020-06-07 04:00:00',
  //       length: '2:00:00',
  //       repeats: 'none'
  //     },
  //     {
  //       action: 'Study for Bio Test',
  //       start_date: '2020-06-09 13:00:00',
  //       length: '1:00:00',
  //       repeats: 'none'
  //     },
  //     {
  //       action: 'Work on Cheese',
  //       start_date: '2020-06-15 18:00:00',
  //       length: '0:35:00',
  //       repeats: 'none'
  //     }
  //   ]
  // }

  const data = (await axios.get(endpoint + '/schedule')).data

  if (data instanceof String) {
    console.error(data)
  }

  return data.events
}

async function addSchedule(action, tag, startDate, length, repeats) {
  // return true

  const data = (await axios.post(endpoint + '/schedule', { }, {
    params: {
      action,
      tag,
      start_date: startDate,
      length,
      repeats
    }
  })).data

  if (data !== 'OK') {
    console.error(data)
  }

  return data === 'OK'
}

async function resetEverything() {
  await axios.get(endpoint + '/reset')
}

async function rejectAndRetry(input, edit) {
  const userId = input.requestEnvelope.session.user.userId

  if (!users[userId]) {
    return input.responseBuilder
    .speak('Sorry, I misunderstood. Could you ask again?')
    .reprompt('Sorry, I misunderstood. Could you ask again?')
    .getResponse()
  }

  const details = users[userId]

  if (!await giveSuggestion(details.tag, details.start_date, details.length, details.repeats, false)) {
    return input.responseBuilder
    .speak('Something went wrong with learning.')
    .getResponse()
  }

  let after = details.after
  let by = details.by

  const date = Alexa.getSlotValue(input.requestEnvelope, 'date')
  const time = Alexa.getSlotValue(input.requestEnvelope, 'time')

  if (edit === 'after') {
    if (date || time) {
      after = combineTimes(date, time).format()
    } else {
      after = details.start_date
    }
  }

  if (edit === 'before') {
    if (date || time) {
      by = combineTimes(date, time).format()
    } else {
      by = details.start_date
    }
  }

  let suggestion = await getSuggestion(details.action, after, by)

  let newDetails = {
    action: details.action,
    tag: suggestion.tag,
    start_date: suggestion.start_date,
    length: suggestion.length,
    repeats: 'none',
    after,
    by,
  }

  users[userId] = newDetails

  const format =
    (moment(newDetails.start_date).year() === moment().year())
      ? 'dddd D MMMM [at] HH:mm' : 'dddd D MMMM YYYY [at] HH:mm'

  const text =
    `How about ${moment(newDetails.start_date).format(format)} for about ${moment.duration(newDetails.length, 'minutes').humanize()}?`

  return input.responseBuilder
    .speak(text)
    .reprompt(text)
    .getResponse()
}

function safeFormat(a, b) {
  return a ? a.format(b) : undefined
}

function combineTimes(a, b) {
  if (!a && !b)
    return undefined

  return moment(((a ? a : '') + ' ' + (b ? b : '')).trim())
}

const launchHandler = {
  canHandle(input) {
    return input.requestEnvelope.request.type === 'LaunchRequest'
  },

  handle(input) {
    return input.responseBuilder
      .speak('Hello, what would you like to do?')
      .reprompt('Sorry, I misunderstood. Could you ask again?')
      .getResponse()
  }
}

const endedHandler = {
  canHandle(input) {
    return input.requestEnvelope.request.type === 'SessionEndedRequest'
  },

  handle(input) {
    const userId = input.requestEnvelope.session.user.userId

    delete users[userId]

    return input.responseBuilder
      .withShouldEndSession(true)
      .getResponse()
  }
}

const errorHandler = {
  canHandle() {
    return true
  },

  handle(input, error) {
    console.log(`Error handled: ${error.message}`)

    return input.responseBuilder
      .speak('An error occurred.')
      .getResponse()
  },
}

let users = { }

let skill = Alexa.SkillBuilders.custom()
.addRequestHandlers(
  launchHandler,
  intent('PingIntent', (input) => {
    return input.responseBuilder
      .speak('Pong.')
      .getResponse()
  }),
  intent('ScheduleIntent', async (input) => {
    const userId = input.requestEnvelope.session.user.userId

    const event = Alexa.getSlotValue(input.requestEnvelope, 'event')
    const byTime = Alexa.getSlotValue(input.requestEnvelope, 'byTime')
    const byDate = Alexa.getSlotValue(input.requestEnvelope, 'byDate')
    const afterTime = Alexa.getSlotValue(input.requestEnvelope, 'afterTime')
    const afterDate = Alexa.getSlotValue(input.requestEnvelope, 'afterDate')
    const forTime = Alexa.getSlotValue(input.requestEnvelope, 'forTime')
    const forDate = Alexa.getSlotValue(input.requestEnvelope, 'forDate')
    const untilTime = Alexa.getSlotValue(input.requestEnvelope, 'untilTime')
    const length = Alexa.getSlotValue(input.requestEnvelope, 'length')

    let suggestion = await getSuggestion(event,
      safeFormat(combineTimes(afterDate, afterTime)),
      safeFormat(combineTimes(byDate, byTime)))

    // echo quinoa book my birthday for january 5th at 5:00pm until 7:00pm
    if ((forTime || forDate) && (untilTime || length)) { // enough information to book
      const time = combineTimes(forDate, forTime)

      let eventLength

      if (untilTime) {
        eventLength = moment.duration(untilTime).subtract(moment.duration(forTime)).minutes()
      }

      if (length) {
        eventLength = moment.duration(length).minutes()
      }

      if (!await addSchedule(event, suggestion.tag, safeFormat(time), eventLength, 'none'))
        return input.responseBuilder
          .speak(`Could not add a new event.`)
          .getResponse()

      return input.responseBuilder
        .speak(`Scheduled ${event} on ${safeFormat(time, 'LLLL')} for ${eventLength.humanize()}.`)
        .getResponse()
    } else {
      let guessTime = (forTime || forDate) ? safeFormat(combineTimes(forDate, forTime), 'LLLL') : suggestion.start_date
      let guessLength = length ? moment.duration(length).minutes() : suggestion.length

      let details = {
        action: event,
        tag: suggestion.tag,
        start_date: guessTime,
        length: guessLength,
        repeats: 'none',
        after: combineTimes(afterDate, afterTime),
        by: combineTimes(byDate, byTime)
      }

      users[userId] = details

      const format =
        (moment(guessTime).year() === moment().year()) ? 'dddd D MMMM [at] HH:mm' : 'dddd D MMMM YYYY [at] HH:mm'

      const text =
        `How about ${safeFormat(moment(guessTime), format)} for about ${moment.duration(guessLength, 'minutes').humanize()}?`

      return input.responseBuilder
        .speak(text)
        .reprompt(text)
        .getResponse()
    }
  }),
  intent('ShowScheduleIntent', async (input) => {
    let schedule = await getSchedule()

    if (schedule.length === 0) {
      return input.responseBuilder
        .speak('You have nothing on your schedule.')
        .getResponse()
    }

    return input.responseBuilder
      .speak(`On your schedule there is ${schedule.map(e => {
        return `${e.action} at ${moment(e.start_date).format('LLLL')}`
      }).join(' and ')}`)
      .getResponse()
  }),
  intent('AMAZON.FallbackIntent', (input) => {
    return input.responseBuilder
      .speak('Hmm, not sure what you mean.')
      .getResponse()
  }),
  intent('AMAZON.CancelIntent', (input) => {
    return input.responseBuilder.getResponse()
  }),
  intent('AMAZON.StopIntent', (input) => {
    return input.responseBuilder.getResponse()
  }),
  intent('AMAZON.YesIntent', async (input) => {
    const userId = input.requestEnvelope.session.user.userId

    if (!users[userId]) {
      return input.responseBuilder
        .speak('Sorry, I misunderstood. Could you ask again?')
        .reprompt('Sorry, I misunderstood. Could you ask again?')
        .getResponse()
    }

    const details = users[userId]

    if (!await giveSuggestion(details.tag, details.start_date, details.length, details.repeats, true)) {
      return input.responseBuilder
        .speak('Something went wrong with learning.')
        .getResponse()
    }

    if (!await addSchedule(details.action, details.tag, details.start_date, details.length, details.repeats)) {
      return input.responseBuilder
        .speak('Could not add event to schedule.')
        .getResponse()
    }

    return input.responseBuilder
      .speak('Alright, I have added that event for you.')
      .getResponse()
  }),
  intent('AMAZON.NoIntent', async (input) => {
    return await rejectAndRetry(input, 'none')
  }),
  intent('AfterIntent', async (input) => {
    return await rejectAndRetry(input, 'after')
  }),
  intent('BeforeIntent', async (input) => {
    return await rejectAndRetry(input, 'before')
  }),
  intent('ResetScheduleIntent', async (input) => {
    await resetEverything()

    return input.responseBuilder
      .speak('Everything has been reset.')
      .getResponse()
  }),
  endedHandler,
)
.addErrorHandlers(errorHandler)
.create()

exports.handler = async (event, context) => {
  console.log(event)

  return await skill.invoke(event, context)
}

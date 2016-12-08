/* eslint-disable babel/new-cap */

import _ from 'lodash'
import {defineSupportCode} from '../../'
import {findScenario, findStep, neutraliseVariableValues} from '../support/json_output_helpers'
import {getAdditionalErrorText, normalizeText} from '../support/helpers'
import assert from 'assert'
import jsonDiff from 'json-diff'

defineSupportCode(function({Then}) {
  Then(/^it outputs this json:$/, function(expectedOutput) {
    const actualOutput = this.lastRun.stdout
    expectedOutput = expectedOutput.replace(/<current-directory>/g, this.tmpDir.replace(/\\/g,'/'))

    const errorSuffix = '\n\n' + actualOutput + '\n' + getAdditionalErrorText(this.lastRun)

    let actualJson
    try { actualJson = JSON.parse(actualOutput.replace(/\\\\/g,'/')) }
    catch(err) { throw new Error('Error parsing actual JSON:\n' + actualOutput + '\n' + err + errorSuffix) }

    let expectedJson
    try { expectedJson = JSON.parse(expectedOutput) }
    catch(err) { throw new Error('Error parsing expected JSON:\n' + expectedOutput + '\n' + err + errorSuffix) }

    neutraliseVariableValues(actualJson)
    neutraliseVariableValues(expectedJson)

    const diff = jsonDiff.diffString(expectedJson, actualJson)

    assert.deepEqual(actualJson, expectedJson, diff + errorSuffix)
  })

  Then(/^it runs (\d+) scenarios$/, function (count) {
    if (this.lastRun.error) {
      throw new Error('Expected last run to pass but it failed\n' +
                      'Output:\n' + normalizeText(this.lastRun.stdout) + '\n' +
                      'Error:\n' + normalizeText(this.lastRun.stderr))
    }

    const features = JSON.parse(this.lastRun.stdout)
    assert.equal(parseInt(count), features[0].elements.length)
  })

  Then(/^it runs the scenario "([^"]*)"$/, function (scenarioName) {
    const features = JSON.parse(this.lastRun.stdout)
    assert.equal(1, features.length)
    assert.equal(1, features[0].elements.length)
    assert.equal(features[0].elements[0].name, scenarioName)
  })

  Then(/^it runs the scenarios "([^"]*)" and "([^"]*)"$/, function (scenarioName1, scenarioName2) {
    const features = JSON.parse(this.lastRun.stdout)
    assert.equal(1, features.length)
    assert.equal(2, features[0].elements.length)
    assert.equal(features[0].elements[0].name, scenarioName1)
    assert.equal(features[0].elements[1].name, scenarioName2)
  })

  Then(/^the scenario "([^"]*)" has the steps$/, function (name, table) {
    const features = JSON.parse(this.lastRun.stdout)
    const scenario = findScenario(features, function(element) {
      return element.name === name
    })
    const stepNames = scenario.steps.map(function(step){
      return [step.name]
    })
    assert.deepEqual(stepNames, table.rows())
  })

  Then(/^the step "([^"]*)" has status (failed|passed|pending)(?: with "([^"]*)")?$/, function (name, status, errorMessage) {
    let features
    try {
      features = JSON.parse(this.lastRun.stdout)
    } catch (error) {
      error.message += '\n\n' + this.lastRun.stdout + '\n\n' + getAdditionalErrorText(this.lastRun)
      throw error
    }
    const step = findStep(features, _.identity, ['name', name])
    try {
      assert.equal(step.result.status, status)
    } catch (error) {
      if (step.result.status === 'failed' && status !== 'failed') {
        error.message += '\n\n Step Error Message: ' + step.result.error_message + '\n\n'
      }
      throw error
    }
    if (errorMessage && step.result.error_message.indexOf(errorMessage) === -1) {
      throw new Error('Expected "' + name + '" to have an error_message containing "' +
                      errorMessage + '"\n' + 'Got:\n' + step.result.error_message)
    }
  })

  Then(/^the (first|second) scenario has the steps$/, function (cardinal, table) {
    const scenarioIndex = cardinal === 'first' ? 0 : 1
    const features = JSON.parse(this.lastRun.stdout)
    const scenario = findScenario(features, function(element, index) {
      return index === scenarioIndex
    })
    const stepNames = scenario.steps.map(function(step){
      return [step.name]
    })
    assert.deepEqual(stepNames, table.rows())
  })

  Then(/^the (first|second) scenario has the step "([^"]*)" with the doc string$/, function (cardinal, name, docString) {
    const features = JSON.parse(this.lastRun.stdout)
    const scenarioIndex = cardinal === 'first' ? 0 : 1
    const step = findStep(features, function(element, index){
      return index === scenarioIndex
    }, ['name', name])
    assert.equal(step.arguments[0].content, docString)
  })

  Then(/^the (first|second) scenario has the step "([^"]*)" with the table$/, function (cardinal, name, table) {
    const features = JSON.parse(this.lastRun.stdout)
    const scenarioIndex = cardinal === 'first' ? 0 : 1
    const step = findStep(features, function(element, index){
      return index === scenarioIndex
    }, ['name', name])
    const expected = table.raw().map(function (row) {
      return {cells: row}
    })
    assert.deepEqual(step.arguments[0].rows, expected)
  })

  Then(/^the (first|second) scenario has the name "([^"]*)"$/, function (cardinal, name) {
    const scenarioIndex = cardinal === 'first' ? 0 : 1
    const features = JSON.parse(this.lastRun.stdout)
    const scenario = findScenario(features, function(element, index) {
      return index === scenarioIndex
    })
    assert.equal(scenario.name, name)
  })

  Then(/^the json output has the scenarios with names$/, function (table) {
    const expectedNames = table.rows().map(function(row){ return row[0] })
    const features = JSON.parse(this.lastRun.stdout)
    const actualNames = []
    features.forEach(function(feature) {
      feature.elements.forEach(function(element){
        actualNames.push(element.name)
      })
    })
    assert.deepEqual(expectedNames, actualNames)
  })

  Then(/^the json output's first scenario has the description "([^"]*)"$/, function (description) {
    const features = JSON.parse(this.lastRun.stdout)
    assert.equal(features[0].elements[0].description.trim(), description)
  })
})

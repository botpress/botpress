"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var sdk = _interopRequireWildcard(require("botpress/sdk"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const generateFlow = data => {
  const invalidTextData = {};

  if (data.config.invalidText && data.config.invalidText.length) {
    invalidTextData.text = data.config.invalidText;
  }

  const maxAttempts = data.config.nbMaxRetries;
  const nodes = [{
    name: 'entry',
    onEnter: [{
      type: sdk.NodeActionType.RenderElement,
      name: `#!${data.contentId}`,
      args: {
        skill: 'choice'
      }
    }],
    next: [{
      condition: 'true',
      node: 'parse'
    }]
  }, {
    name: 'parse',
    onReceive: [{
      type: sdk.NodeActionType.RunAction,
      name: 'skill-choice/parse_answer',
      args: data
    }],
    next: [{
      condition: `state['skill-choice-valid'] === true`,
      node: '#'
    }, {
      condition: 'true',
      node: 'invalid'
    }]
  }, {
    name: 'invalid',
    onEnter: [{
      type: sdk.NodeActionType.RunAction,
      name: 'skill-choice/invalid_answer'
    }],
    next: [{
      condition: `state['skill-choice-invalid-count'] <= "3"`,
      node: 'sorry'
    }, {
      condition: 'true',
      node: '#'
    }]
  }, {
    name: 'sorry',
    onEnter: [{
      type: sdk.NodeActionType.RenderElement,
      name: `#!${data.contentId}`,
      args: { ...invalidTextData,
        skill: 'choice'
      }
    }],
    next: [{
      condition: 'true',
      node: 'parse'
    }]
  }];
  return {
    transitions: createTransitions(data),
    flow: {
      nodes: nodes,
      catchAll: {
        next: []
      }
    }
  };
};

const createTransitions = data => {
  const transitions = Object.keys(data.keywords).map(choice => {
    const choiceShort = choice.length > 8 ? choice.substr(0, 7) + '...' : choice;
    return {
      caption: `User picked [${choiceShort}]`,
      condition: `state['skill-choice-ret'] == "${choice}"`,
      node: 'entry'
    };
  });
  transitions.push({
    caption: 'On failure',
    condition: 'true',
    node: 'entry'
  });
  return transitions;
};

var _default = {
  generateFlow
};
exports.default = _default;
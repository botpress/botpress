let bindingPath = 'crfsuite_linux.node'
if (process.platform === 'win32') {
  bindingPath = 'crfsuite_win.node'
} else if (process.platform === 'darwin') {
  bindingPath = 'crfsuite_osx.node'
}

const binding = require(`./bin/${bindingPath}`)

export const Trainer = binding.TrainerClass
export const Tagger = binding.TaggerClass

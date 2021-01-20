process.env.NATIVE_EXTENSIONS_DIR = './build/native-extensions'
process.APP_DATA_PATH = require('./core/misc/app_data').getAppDataPath()
import './jest-rewire'

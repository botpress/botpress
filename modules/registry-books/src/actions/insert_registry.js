/**
 * This function allows data insertion in the Registry Books module.
 *
 * @title Insert Registry
 * @category Registry Books
 * @param {string} [registryCategory=] - Category in which the registry will be stored
 * @param {string} [registryData=] - Data that will be stored
 * 
 */

class StringMinifier {
  //Replaces all matches mapped by an object
  mapReplace(map, string) {
    let regex = [];
    for (let key in map)
      regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    return string.replace(new RegExp(regex.join('|'), "g"), function (word) {
      return map[word];
    });
  };

  //Will remove possible noise from the string
  minifyString(string, opt = {}) {
    string = string.toLowerCase();

    if (opt.language == 'pt') {
      return this.minifyStringPt(string, opt)
    }

    if (opt.fullMinify) {
      string = string.replace(new RegExp(/[ .,?]/, 'g'), "");
    }
    return string;
  }

  //Will remove possible noise from the string, Portuguese version
  minifyStringPt(string, opt) {
    //Special characteres
    string = this.mapReplace({
      "é": "e", "è": "e", "ê": "e", "ã": "a", "â": "a", "ç": "c", "õ": "o",
      "ô": "o", "ò": "o", "ó": "o", "à": "a", "á": "a", "í": "i", "ì": "i", "ú": "u", "û": "u", "ù": "u", ":": " ", "-": "", "\\": " ", "'": " ", "\"": " "
    }, string);
    if (opt.remove_question_indicator || opt.fullMinify) {
      string = string.replace(new RegExp(/^o[ ]?que\se\s|^o[ ]?que\s|^quais\s|^como\s|^qual\s/, 'g'), "");
    }
    if (opt.remove_noise || opt.fullMinify) {
      string = string.replace(new RegExp(/^o\s|^a\s|\sa\s|\sas\s|^as\s|^os\s|\so\s|\sos\s|\sda\s|\sdas\s|\sdo\s|\sdos\s|\sde\s/, 'g'), " ");
    }
    if (opt.fullMinify) {
      string = string.replace(new RegExp(/[ .,?]/, 'g'), "");
    }
    return string;
  }
}

const minifier = new StringMinifier();

async function insertRegistry() {
  const date = new Date()
  //If no data key is proveded, a minified version of the data will be used
  const {
    registryData,
    registryLanguage,
    registryDataKey = minifier.minifyString(registryData, { language: registryLanguage, fullMinify: true }),
    registryCategory
  } = args
  const result = await bp.database('registry_books')
    .where({ 'data_key': registryDataKey, 'category': registryCategory, 'registered_on': date, 'botId': event.botId })
  if (result.length > 0) {
    await bp.database('registry_books').update('hit_count', (result[0].hit_count + 1)).where('id', result[0].id)
  } else {
    await bp.database('registry_books').insert({
      botId: event.botId,
      category: registryCategory,
      data_key: registryDataKey,
      data: registryData,
      registered_on: date,
      hit_count: 1,
    });
  }
}

return insertRegistry();
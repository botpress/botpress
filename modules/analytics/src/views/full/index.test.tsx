import Adapter from '@wojtekmaj/enzyme-adapter-react-17'
import { shallow, configure } from 'enzyme'

import React from 'react'
import Analytics from './index'

configure({ adapter: new Adapter() })

describe('<Analytics />', () => {
  it('renders three <Analytics /> components', () => {
    const wrapper = shallow(<Analytics />)
    expect(wrapper.find(Analytics).to.have.lengthOf(3))
  })
})

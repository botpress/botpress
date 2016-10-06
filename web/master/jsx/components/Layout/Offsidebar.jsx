import React from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import OffsidebarRun from './Offsidebar.run';

class Offsidebar extends React.Component {

    constructor(props, context) {
        super(props, context);
        this.state = {
            key: 1
        };
    }

    componentDidMount() {
        OffsidebarRun();
    }

    handleSelect(key) {
        this.setState({
            key
        });
    }

    render() {
        const tabIconA = <em className="icon-equalizer fa-lg"></em>;
        const tabIconB = <em className="icon-user fa-lg"></em>;
        return (
            <aside className="offsidebar hide">
                { /* START Off Sidebar (right) */ }
                <Tabs activeKey={ this.state.key } onSelect={ this.handleSelect.bind(this) } justified id="tabId">
                    <Tab eventKey={ 1 } title={ tabIconA }>
                        <h3 className="text-center text-thin">Tab 1</h3>
                    </Tab>
                    <Tab eventKey={ 2 } title={ tabIconB }>
                        <h3 className="text-center text-thin">Tab 2</h3>
                    </Tab>
                </Tabs>
                { /* END Off Sidebar (right) */ }
            </aside>
            );
    }

}

export default Offsidebar;

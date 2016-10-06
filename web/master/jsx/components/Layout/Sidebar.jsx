import React from 'react';
import { Router, Route, Link, History } from 'react-router';
import pubsub from 'pubsub-js';
import { Collapse } from 'react-bootstrap';
import SidebarRun from './Sidebar.run';

class Sidebar extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.state = {
            userBlockCollapse: false,
            collapse: {
                singleview: this.routeActive(['singleview']),
                submenu: this.routeActive(['submenu'])
            }
        };
        this.pubsub_token = pubsub.subscribe('toggleUserblock', () => {
            this.setState({
                userBlockCollapse: !this.state.userBlockCollapse
            });
        });
    };

    componentDidMount() {
        SidebarRun();
    }

    componentWillUnmount() {
        // React removed me from the DOM, I have to unsubscribe from the pubsub using my token
        pubsub.unsubscribe(this.pubsub_token);
    }

    routeActive(paths) {
        paths = Array.isArray(paths) ? paths : [paths];
        for (let p in paths) {
            if (this.context.router.isActive(paths[p]) === true)
                return true;
        }
        return false;
    }

    toggleItemCollapse(stateName) {
        var newCollapseState = {};
        for (let c in this.state.collapse) {
            if (this.state.collapse[c] === true && c !== stateName)
                this.state.collapse[c] = false;
        }
        this.setState({
            collapse: {
                [stateName]: !this.state.collapse[stateName]
            }
        });
    }

    render() {
        return (
            <aside className='aside'>
                { /* START Sidebar (left) */ }
                <div className="aside-inner">
                    <nav data-sidebar-anyclick-close="" className="sidebar">
                        { /* START sidebar nav */ }
                        <ul className="nav">
                            { /* START user info */ }
                            <li className="has-user-block">
                                <Collapse id="user-block" in={ this.state.userBlockCollapse }>
                                    <div className="item user-block">
                                        { /* User picture */ }
                                        <div className="user-block-picture">
                                            <div className="user-block-status">
                                                <img src="img/user/02.jpg" alt="Avatar" width="60" height="60" className="img-thumbnail img-circle" />
                                                <div className="circle circle-success circle-lg"></div>
                                            </div>
                                        </div>
                                        { /* Name and Job */ }
                                        <div className="user-block-info">
                                            <span className="user-block-name">Hello, Mike</span>
                                            <span className="user-block-role">Designer</span>
                                        </div>
                                    </div>
                                </Collapse>
                            </li>
                            { /* END user info */ }
                            { /* Iterates over all sidebar items */ }
                            <li className="nav-heading ">
                                <span data-localize="sidebar.heading.HEADER">Main Navigation</span>
                            </li>

                            <li className={ this.routeActive('singleview') ? 'active' : '' }>
                                <Link to="singleview" title="Single View">
                                <em className="icon-grid"></em>
                                <span data-localize="sidebar.nav.SINGLEVIEW">Single View</span>
                                </Link>
                            </li>

                            <li className={ this.routeActive(['submenu']) ? 'active' : '' }>
                                <div className="nav-item" onClick={ this.toggleItemCollapse.bind(this, 'submenu') }>
                                    <div className="pull-right label label-info">1</div>
                                    <em className="icon-speedometer"></em>
                                    <span data-localize="sidebar.nav.MENU">Menu</span>
                                </div>
                                <Collapse in={ this.state.collapse.submenu } timeout={ 100 }>
                                    <ul id="submenu" className="nav sidebar-subnav">
                                        <li className="sidebar-subnav-header">Submenu</li>
                                        <li className={ this.routeActive('submenu') ? 'active' : '' }>
                                            <Link to="submenu" title="Submenu">
                                            <span data-localize="sidebar.nav.SUBMENU">Submenu</span>
                                            </Link>
                                        </li>
                                    </ul>
                                </Collapse>
                            </li>

                        </ul>
                        { /* END sidebar nav */ }
                    </nav>
                </div>
                { /* END Sidebar (left) */ }
            </aside>
            );
    }

}

Sidebar.contextTypes = {
    router: React.PropTypes.object
};

export default Sidebar;

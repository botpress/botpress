import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

import HeaderHorizontal from './HeaderHorizontal'
import Offsidebar from './Offsidebar'
import Footer from './Footer'

class Base extends React.Component {

    componentWillMount() {
        $('body').addClass('layout-h');
    }

    componentWillUnmount() {
        // Only necessary for demo to restore classic layout
        $('body').removeClass('layout-h');
    }

    render() {

        // Animations supported
        //      'rag-fadeIn'
        //      'rag-fadeInUp'
        //      'rag-fadeInDown'
        //      'rag-fadeInRight'
        //      'rag-fadeInLeft'
        //      'rag-fadeInUpBig'
        //      'rag-fadeInDownBig'
        //      'rag-fadeInRightBig'
        //      'rag-fadeInLeftBig'
        //      'rag-zoomBackDown'

        const animationName = 'rag-fadeIn'

        return (
            <div className="wrapper">
                <HeaderHorizontal />

                <Offsidebar />

                <ReactCSSTransitionGroup
                  component="section"
                  transitionName={animationName}
                  transitionEnterTimeout={500}
                  transitionLeaveTimeout={500}
                >
                  {React.cloneElement(this.props.children, {
                    key: Math.random()
                  })}
                </ReactCSSTransitionGroup>

                <Footer />
            </div>
        );
    }

}

export default Base;

import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Col, Button } from 'reactstrap'
import _ from 'lodash'
import SectionLayout from '../Layouts/Section'
import BuyLicenseModal from '../Components/Licensing/BuyLicenseModal'
import CustomizeLicenseForm from '../Components/Licensing/CustomizeLicenseForm'

const DEFAULT_SEATS = 1

class BuyPage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      stripe: null,
      seats: DEFAULT_SEATS,
      price: DEFAULT_SEATS * 100,
      buyModalOpen: false
    }
  }

  toggleBuyModal = () => this.setState({ buyModalOpen: !this.state.buyModalOpen })
  handleTotalChanged = price => this.setState({ price })
  handleSeatsChanged = seats => this.setState({ seats })

  renderContent() {
    return (
      <Fragment>
        <Col md={{ size: 4 }}>
          <CustomizeLicenseForm onSeatsChanged={this.handleSeatsChanged} onTotalChanged={this.handleTotalChanged} />
        </Col>

        <div className="checkout">
          <span className="checkout__total">
            <strong>Total:</strong> {this.state.price}$<sup>/month</sup>
          </span>
          <div className="checkout__buy">
            <Button onClick={this.toggleBuyModal}>Buy</Button>
          </div>
        </div>

        <BuyLicenseModal
          seats={this.state.seats}
          opened={this.state.buyModalOpen}
          toggle={this.toggleBuyModal}
          userInfo={_.omit(this.props.licensingAccount, ['token'])}
          onSuccess={() => {
            this.props.history.push('/my-account')
          }}
        />
      </Fragment>
    )
  }

  render() {
    return <SectionLayout title="Buy new license" activePage="licensing-buy" mainContent={this.renderContent()} />
  }
}

const mapStateToProps = state => ({
  licensingAccount: state.license.licensingAccount
})

export default connect(
  mapStateToProps,
  null
)(BuyPage)

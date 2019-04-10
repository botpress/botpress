import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Table, Button, Jumbotron, Row, Col } from 'reactstrap'
import _ from 'lodash'
import FaFrownO from 'react-icons/lib/fa/frown-o'
import MdVpnKey from 'react-icons/lib/md/vpn-key'
import IconTooltip from '../../Components/IconTooltip'
import SectionLayout from '../../Layouts/Section'
import KeyListItem from '../../Components/Licensing/KeyListItem'
import ActivateRevealKeyModal from '../../Components/Licensing/ActivateRevealKeyModal'
import UpdateLicenseModal from '../../Components/Licensing/UpdateLicenseModal'
import BuyLicenseModal from '../../Components/Licensing/BuyLicenseModal'
import LoadingSection from '../../Components/LoadingSection'
import { fetchAllKeys, fetchProducts, fetchLicensing, logoutUser, licenseUpdated } from '../../../reducers/license'

class KeyList extends Component {
  state = {
    error: false,
    selectedLicense: null,
    keyModalOpen: false,
    updateModalOpen: false,
    buyModalOpen: false
  }

  componentDidMount(prevProps) {
    !this.props.keys && !this.props.fetchingKeys && this.props.fetchAllKeys()
    !this.props.products && !this.props.fetchingProducts && this.props.fetchProducts()
  }

  toggleBuyModal = () => this.setState({ buyModalOpen: !this.state.buyModalOpen })

  onLicenseUpdated = license => {
    this.props.licenseUpdated(license)
    this.setState({ updateModalOpen: false })
  }

  onUseOnServer = () => {
    this.props.fetchLicensing()
  }

  toggleUpdateModal = selectedLicense => {
    this.setState({
      updateModalOpen: !this.state.updateModalOpen,
      selectedLicense
    })
  }

  toggleKeyModal = selectedLicense => {
    this.setState({
      keyModalOpen: !this.state.keyModalOpen,
      selectedLicense
    })
  }

  logoutAccount = () => {
    this.props.logoutUser()
  }

  hasKeys = () => {
    return this.props.keys && this.props.keys.length > 0
  }

  renderKeysTable() {
    const clusterFingerprint = _.get(this.props.licensing, 'fingerprints.cluster_url')

    return (
      <Table className="table--keys">
        <thead>
          <tr>
            <th>Label</th>
            <th>Available Nodes</th>
            <th>Support</th>
            <th>Assigned</th>
            <th>Renews on</th>
            <th>
              Cost &nbsp;
              <IconTooltip className="tooltip--light">
                <span>This price doesn't include part-time nodes or any coupon you may have used</span>
              </IconTooltip>
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {this.props.keys
            .sort((a, b) => {
              if (a.stripeSubscriptionId < b.stripeSubscriptionId) return -1
              if (a.stripeSubscriptionId > b) return 1
              return 0
            })
            .map(key => (
              <KeyListItem
                key={key.stripeSubscriptionId}
                license={key}
                products={this.props.products}
                clusterFingerprint={clusterFingerprint}
                onRevealActivate={this.toggleKeyModal}
                onShowLicenseUpdateModal={this.toggleUpdateModal}
                onUseOnServer={this.onUseOnServer}
                onLicenseUpdated={this.onLicenseUpdated}
              />
            ))}
        </tbody>
      </Table>
    )
  }

  renderNoKeys = () => {
    return (
      <Jumbotron>
        <Row>
          <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
            <h1>
              <FaFrownO />
              &nbsp;You have no keys
            </h1>
            <p>
              License keys are necessary to enable Professional Edition. See{' '}
              <a href="https://botpress.io/docs/pro/licensing">the docs</a> to learn how buy, and activate a pro
              license.
            </p>
            <Button size="sm" color="primary" onClick={this.toggleBuyModal}>
              <MdVpnKey />
              &nbsp;Buy your first key
            </Button>
          </Col>
        </Row>
      </Jumbotron>
    )
  }

  renderPage() {
    return (
      <Fragment>
        {!this.state.error && this.hasKeys() && this.renderKeysTable()}
        {!this.state.error && !this.hasKeys() && this.renderNoKeys()}
        <ActivateRevealKeyModal
          isOpen={this.state.keyModalOpen}
          toggle={this.toggleKeyModal}
          license={this.state.selectedLicense}
          onLicenseChanged={this.props.fetchAllKeys}
        />
        <UpdateLicenseModal
          isOpen={this.state.updateModalOpen}
          toggle={this.toggleUpdateModal}
          license={this.state.selectedLicense}
          refreshLicenses={this.props.fetchAllKeys}
        />
        <BuyLicenseModal
          isOpen={this.state.buyModalOpen}
          toggle={this.toggleBuyModal}
          license={this.state.selectedLicense}
          refreshLicenses={this.props.fetchAllKeys}
        />
      </Fragment>
    )
  }

  renderSideMenu() {
    return (
      <div className="licensing_sideMenu">
        <Button size="sm" color="primary" onClick={this.toggleBuyModal}>
          <MdVpnKey />
          &nbsp;
          {this.hasKeys() ? <span>Buy more keys</span> : <span>Buy your first key</span>}
        </Button>
        <Button size="sm" color="link" onClick={this.logoutAccount}>
          Logout
        </Button>
      </div>
    )
  }

  render() {
    return (
      <SectionLayout
        title="License Keys"
        helpText="Manage your license keys, edit your subscriptions and purchase new license keys"
        activePage="keys"
        mainContent={this.props.fetchingKeys ? <LoadingSection /> : this.renderPage()}
        sideMenu={this.props.fetchingKeys ? <span /> : this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({ ...state.license })

const mapDispatchToProps = { fetchAllKeys, fetchProducts, fetchLicensing, logoutUser, licenseUpdated }
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KeyList)

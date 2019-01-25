import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Table, Button } from 'reactstrap'
import _ from 'lodash'
import IconTooltip from '../Components/IconTooltip'
import SectionLayout from '../Layouts/Section'
import KeyListItem from '../Components/Licensing/KeyListItem'
import ActivateRevealKeyModal from '../Components/Licensing/ActivateRevealKeyModal'
import UpdateLicenseModal from '../Components/Licensing/UpdateLicenseModal'
import BuyLicenseModal from '../Components/Licensing/BuyLicenseModal'
import LoadingSection from '../Components/LoadingSection'
import LoginModal from '../Components/Licensing/LoginModal'
import { fetchAllKeys, fetchProducts, fetchLicensing } from '../../reducers/license'
import { isAuthenticated } from '../../Auth/licensing'
import { logout } from '../../Auth/licensing'

class KeyList extends Component {
  state = {
    error: false,
    selectedLicense: null,
    keyModalOpen: false,
    updateModalOpen: false,
    buyModalOpen: false,
    loginModalOpen: false
  }

  componentDidUpdate(prevProps) {
    if (!isAuthenticated()) {
      return
    }

    !this.props.keys.length && this.props.fetchAllKeys()
    !this.props.products.length && this.props.fetchProducts()
  }

  toggleBuyModal = () => this.setState({ buyModalOpen: !this.state.buyModalOpen })
  toggleLoginModal = () => this.setState({ loginModalOpen: !this.state.loginModalOpen })

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
    logout()
    this.forceUpdate()
  }

  refresh = () => {
    this.props.fetchAllKeys()
    this.props.fetchLicensing()
  }

  renderKeysTable() {
    const clusterFingerprint = _.get(this.props.licensing, 'fingerprints.cluster_url')
    return (
      <Table className="table--keys">
        <thead>
          <tr>
            <th>Label</th>
            <th>Nodes</th>
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
                onLicenseUpdated={this.toggleUpdateModal}
                refreshLicense={this.refresh}
              />
            ))}
        </tbody>
      </Table>
    )
  }

  renderPage() {
    if (!isAuthenticated()) {
      return this.renderNotLoggedIn()
    }

    return (
      <Fragment>
        {!this.state.error && <Fragment>{this.props.keys.length > 0 && this.renderKeysTable()}</Fragment>}
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

  renderNotLoggedIn() {
    return (
      <div>
        To purchase a new license key or to manage existing ones, please login to your Botpress Account.
        <br />
        <br />
      </div>
    )
  }

  renderSideMenu() {
    if (!isAuthenticated()) {
      return (
        <div>
          <Button size="sm" onClick={this.toggleLoginModal}>
            Login
          </Button>
          <LoginModal isOpen={this.state.loginModalOpen} toggle={this.toggleLoginModal} />
        </div>
      )
    } else {
      return (
        <div>
          <Button size="sm" onClick={this.logoutAccount}>
            Logout
          </Button>
          <br />
          <br />
          <Button size="sm" color="success" onClick={this.toggleBuyModal}>
            {this.props.keys.length > 0 && <span>Buy more licenses</span>}
            {this.props.keys.length === 0 && <span>Buy your first license</span>}
          </Button>
        </div>
      )
    }
  }

  render() {
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="Keys"
        helpText="Manage your license keys, edit your subscriptions and purchase new license keys"
        activePage="keys"
        mainContent={this.props.isLoadingKeys ? renderLoading() : this.renderPage()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({
  keys: state.license.keys,
  products: state.license.products,
  isLoadingKeys: state.license.isLoadingKeys,
  licensing: state.license.licensing
})

const mapDispatchToProps = { fetchAllKeys, fetchProducts, fetchLicensing }
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KeyList)

import React, { Component, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
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
import { fetchAllKeys, fetchProducts } from '../../reducers/license'
import { isAuthenticated } from '../../Auth/licensing'

class KeyList extends Component {
  state = {
    error: false,
    selectedLicense: null,
    keyModalOpen: false,
    updateModalOpen: false,
    buyModalOpen: false
  }

  componentDidMount() {
    if (!isAuthenticated()) {
      return
    }

    if (!this.props.keys.length) {
      this.props.fetchAllKeys()
    }

    if (!this.props.products.length) {
      this.props.fetchProducts()
    }
  }

  toggleBuyModal = () => this.setState({ buyModalOpen: !this.state.buyModalOpen })

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
                refreshLicense={this.props.fetchAllKeys}
              />
            ))}
        </tbody>
      </Table>
    )
  }

  renderPage() {
    return (
      <Fragment>
        {!this.state.error && (
          <Fragment>
            {this.props.keys.length > 0 && this.renderKeysTable()}

            <Button size="sm" color="success" onClick={this.toggleBuyModal}>
              {this.props.keys.length > 0 && <span>Buy more licenses</span>}
              {this.props.keys.length === 0 && <span>Buy your first license</span>}
            </Button>
          </Fragment>
        )}
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

  render() {
    if (!isAuthenticated()) {
      return <Redirect to={{ pathname: '/licensing/login' }} />
    }
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="Keys"
        activePage="keys"
        mainContent={this.props.isLoadingKeys ? renderLoading() : this.renderPage()}
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

const mapDispatchToProps = { fetchAllKeys, fetchProducts }
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KeyList)

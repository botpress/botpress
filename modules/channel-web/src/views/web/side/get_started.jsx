import React from 'react'
import { Card, CardBody, CardTitle, CardText, ListGroup, ListGroupItem, Button } from 'reactstrap'
import Avatar from 'react-avatar'
import style from './style.scss'

export class GetStarted extends React.Component {
  render() {
    const details = this.props.bot.details
    const bot = this.props.bot

    return (
      <Card>
        <CardBody>
          <div className={style.welcomeImage}>
            <Avatar name={bot.name} src={details.avatarUrl} />
          </div>
          <CardTitle className={style.welcomeTitle}>{bot.name}</CardTitle>
          <CardText className={style.welcomeDescription}>{bot.description}</CardText>
        </CardBody>
        <ListGroup className={style.welcomeDetails}>
          {details.emailAddress && (
            <ListGroupItem>
              <div className={style.welcomeIcon}>
                <i className="material-icons">email</i>
              </div>
              {details.emailAddress}
            </ListGroupItem>
          )}
          {details.phoneNumber && (
            <ListGroupItem>
              <div className={style.welcomeIcon}>
                <i className="material-icons">phone</i>
              </div>
              {details.phoneNumber}
            </ListGroupItem>
          )}
          {details.website && (
            <ListGroupItem>
              <a href={details.website}>Visit our website</a>
            </ListGroupItem>
          )}
          {details.termsConditions && (
            <ListGroupItem>
              <a href={details.termsConditions}>View Terms of Service</a>
            </ListGroupItem>
          )}
        </ListGroup>
        <CardBody>
          <Button className={style.welcomeGetStarted} onClick={this.props.onGetStarted}>
            Get Started
          </Button>
        </CardBody>
      </Card>
    )
  }
}

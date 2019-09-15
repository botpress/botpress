---
id: version-11.5.0-licensing
title: Licensing
original_id: licensing
---

To enable Botpress pro features, you need to create a Botpress account, customize & buy your license and finally activate it on your Botpress Server installation. Everything you need to know is in this guide, we'll walk you to the process step by step.

Before we move on, make sure to have the followings :

- A working Botpress installation [running on pro](/docs/pro/about-pro#activate-pro)
- Admin rights on your Botpress installation (if downloaded & started Botpress you're good to go)
- A connection to the Internet
- A valid credit card

**Note**: There is a _Botpress is currently not licensed_ red band, this is totally normal since you're running on pro without having a license.

## Create Botpress account

In order to buy a pro license, you need to create an account on our botpress licensing server (different from the account you created to access your botpress installation). To do so, open your Botpress admin and go to My Account in your user top right menu.

![BP account menu](assets/bp-account-menu.jpg)

Go on the **My Botpress Account** tab and click on **Login to Botpress**. There you'll end up on a login/register screen make sure to click on **Create an account** if you don't have any yet. Fill the form and hit Register. Check your mails, a verification email will be sent shortly.

## Customize your license

Now that we have a Botpress account setup, we can buy license. Go ahead an click on **Buy your first key**. You can fill your license a friendly name to make it easy to recognize which license is used where. By default, only the Botpress pro license is enabled which allows you to:

- Create unlimited bots
- Add collaborators
- Define and assign custom roles and permissions to your collaborators

Note that all bots will run on a single instance, where you might end up with a scalability issue when your bot hit a certain messages / sec threshold. To address this problem, we allow our clients to scale their Botpress installation to [multiple nodes](/docs/developers/cluster). You can add as many additional Nodes to your license as you need.

![BP customie license](assets/bp-customize-license.jpg)

Don't worry, you don't have to plan everything in advance, you can always change your plan later on. If you feel like you need additional support from the Botpress team, you can check the Gold support. Go ahead and complete the checkout form! If all is fine, you should end up with a screen like the following :

![BP license keys not active](assets/bp-keys-not-active.jpg)

## Activate your license

To activate your license on your current Botpress installation, simply click on **Use on this Server** in the Actions dropdown of your new license. This will add the license key in your Botpress.config.json file and assign your current cluster fingerprint to the license on our license server. Botpress pro features should now be unlocked, your key should be marked as assigned and there should be an **active** label on your license list.

![BP license keys active](assets/bp-keys-active.jpg)

**Note**: If you happen to breach your license (e.g you try to add more nodes than allowed on your license), your bots wont work anymore until you either update your license or get back to an unbreached license state. If you don't remember the limits of your currently activated license, you can always go to the **Server Settings** page in your user top right menu. There you'll have all information on your current license.

![BP license keys active](assets/bp-server-settings.jpg)

## Advanced users

If for some reason you want to activate a license for another botpress installation, use **Assign fingerprint** in the Actions dropdown of your license and enter the target botpress installation fingerprint. Once that done you can copy the license key visible in **Reveal License key** and paste it in your target installation botpress.config.json under the `botpress.lincenseKey` property.

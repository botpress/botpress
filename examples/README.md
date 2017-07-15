# Examples

The following examples are here to help you getting started and/or adding new complex functionnalities to your bots. By using them, you will improve the speed of development for each of your bots.

For each example, you have access to *snippets* of code and graphical *demonstration* so you know exactly what you will get and how to implement them.

## Where to find examples

You can find examples here on [our Github](https://github.com/botpress/botpress/examples), but your can also look at them on [our website](https://botpres.io/examples) where you will have a better overview.

## How to use examples

First, what you need to do is to find an examples that do something similar as what you need. After, you read the documentation and follow the step-by-step guide that have been created for you, copy-paste the section you need in your code and adapt it to your context.

## Add a new example

We always appreciate when people are contributing and helping us making our tool better and easier for everyone to use. So, you are all welcome to create a new example that might help other developers of [our community](https://slack.botpress.io).

#### 1. Code it

First of all, you will need to create your example by coding it. Before getting started, be sure that there's no other example in our list that is already available for the same usecase.

Once, it is done, please, take the time to be sure that there's **no error** and your code is **clean**. Also, if there's an upgrade of Botpress or you find a better way of coding it, it would be really appreciated if you update the examples you have built.


##### Folder structure to respect

```js
  description.json
  README.md
  preview.png
  demo.mp4
```

#### 2. Create a descriptiion file

In your repo, you will need to add a `description.json` file. We need this file for our website to add **title**, **description**, **tags**, **version**, **author** for each example.

```js
{
  "id": "hello_world",
  "title": "Hello world",
  "description": "Short example of an hello world bot.",
  "tags": [ "messenger", "text" ],
  "version": "0.2.10",
  "author": "Dany Fortin-Simard"
}
```

*Note 1: The **version** correspond to the version of **botpress** you are using. You can get it by typing `botpress --version` in command line.*

*Note 2: The **tags** are the categories of your example, you can look on our (website)[https://botpress.io/examples] to have a better idea, but don't worry, we will help you finding related tags in our review.*

#### 3. Take a screenshot

Capture a screenshot (*preview.png*) that represents well the functionnalities of your example. Our picture needs to be formated in **.png** and it needs to respect the standard ratio of **9:16** that almost every cellphone respects.

#### 4. Record a MP4

To show a demo of your example on our website we need to have a short MP4 (*demo.mp4*) that shows what it is doing concretly. The MP4 needs to respect the standard ratio of **9:16**.

Here, we added some links to help you find an *app* to be able to record your screen on your personal cellphone.

- [AZ Screen Recorder](https://play.google.com/store/apps/details?id=com.hecorat.screenrecorder.free)
- [Screen Recorder](https://play.google.com/store/apps/details?id=com.duapps.recorder)
- [Screen Recorder](https://play.google.com/store/apps/details?id=com.nll.screenrecorder)

#### 5. Write a short README.md

This is the most important part. In fact, what you need to do is to create a detailed **step-by-step** guide so everyone will be able to replicate what you have done. For example, you can look at our **hello world** example to have a better idea.

#### 6. Create a pull request

The last step is simple, but if you want to share with others you will need to create a pull request. So, we will add your new example to our list. 

*We will review each example to be sure that there's **no error**, it is pertinent and we have everyting we need to sync it with our website.*

## Get inspired

Look to the other examples on [our website](https://botpress.io/examples) to have fun, get new ideas and develop new awesome bots.

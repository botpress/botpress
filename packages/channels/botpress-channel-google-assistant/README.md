**Note**: This module is under development and can't be considered as stable!

In current implementation you can't initiate sending a message to user from server side, you can only respond to him.
All the responses that were queued within 1s are send back as a response to Google Assistant.

To set up google-assistant and DialogFlow accounts you can follow a guide on video:

<a href="http://www.youtube.com/watch?feature=player_embedded&v=WZY_in9oAjA
" target="_blank"><img src="http://img.youtube.com/vi/WZY_in9oAjA/0.jpg" 
alt="Google Analytics setup instructions" width="240" height="180" border="10" /></a>

Webhook URL is `/api/botpress-channel-ga`. You can use `ngrok` or similar in development to make your webserver available from the internet.

Demo-implemntation can be found here: https://github.com/botpress/botpress-google-analytics-demo

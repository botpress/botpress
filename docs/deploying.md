# Debugging

Here you find how to deploy your application to a Server.

## Amazon AWS (EC2)

1 - First you need to have a custom domain name bought (can be bought in AWS)

2 - Go to [Amazon EC2](https://console.aws.amazon.com/ec2/) in the left bar under _Network & Security_ click on Keypairs.
    2.1 - Click on create, name your keypair and will be downloaded automatically. SAVE IT IN A SECURE PLACE OR YOU WILL NOT BE ABLE TO ACESS THIS MACHINE AGAIN!!

    2.2 - Click on instances, launch instances, select ubuntu server 16.04 LTS, Select The instance type you desire and launch.
3 - When it's online, select your created instance and, if you don't selected a security group, there's created a new one.
    3.1 - Click on this name and you will be in Security Groups List (There's a link in left panel).
    3.2 - Go to Inbound tab, click on edit and Add Rule for your Port Http (80), Https (443) or Custom port (default botpress 3000).
        Important: For Security reasons, keep online only the port you configured in your botfile.js

4 - Go to Load Balancers (Left Bar) and create a new Load Balancer, selecting Application Load Balancer and click in next.
    4.1 - In Basic Configuration, name-it anyway you like and in listeners, add the same inbound ports then you set in step 3.2
    4.2 - Select Availability Zones and click next
    4.3 - In step 3, select the same Security group then you're using in your EC2 Instance.
    4.4 - Step four, name the target anyway you want, select the port and protocol and next
    4.5 - Select the machines you want to put under this load balance (Only One Available in this case, but you can put more later) and create.

5 - Go to [Route 53](https://console.aws.amazon.com/route53) click in hosted zones, created hosted zone and add your custom domain with type Public Hosted Zone.
    OBS: You may need confirm the domain you using. AWS sends an email to address of the domain owner.
    5.1 - Click on your domain name and you will see the NS Register. Go to your domain register provider and configure the Name Servers (NS) with these on Hosted Zone.
    5.2 - Click on create record set, Set "alias" to yes (blank name and IPV4 Type)

6 - Remember of .pem file of step 2? Copy this to your .ssh folder (On Windows is C:\Users\wacal\.ssh)
    6.1 - Connect on your machine by ssh ```ssh ubuntu@YOUR_AMAZON_AWS_PUBLIC_DNS```
        Obs: Go to EC2 -> Instances -> Select your instance and See "Public DNS (IPV4)"
        Obs2: If you use windows [Git Bash (Distributed with Git for Windows)](https://git-scm.com/downloads) it's an excellent choice.

7 - Now you connected, run this commands
    ```cd ~```
    ```curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh```
    ```sudo bash nodesource_setup.sh```
    7.1 - Then install NodeJs and NPM with
    ```sudo apt-get install nodejs```
    7.2 - Next you need to compile some source files
    ```sudo apt-get install build-essential``` 
    7.3 - You can run ```npm --version``` and ```node --version``` to check if instalation is ok.

8 - [Install pm2 to manage process](https://github.com/Unitech/pm2)
    ```npm install -g pm2`` 

9 - Clone your project inside some server folder (i like to put into /var/app/myapp)
    9.1 - ```cd /var/app/myapp``` and run ```npm install```
    9.2 - Put your app into production! ```pm2 start npm -- start``` that's all folks!
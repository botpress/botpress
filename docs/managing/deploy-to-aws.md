# How to deploy to Amazon AWS (EC2)

1. First you need to have a custom domain name bought (can be bought in AWS)

2. Go to [Route 53](https://console.aws.amazon.com/route53) click in hosted zones, created hosted zone and add your custom domain with type Public Hosted Zone.
OBS: You may need confirm the domain you using. AWS sends an email to address of the domain owner.

  1. Click on your domain name and you will see the NS Register. Go to your domain register provider and configure the Name Servers (NS) with these on Hosted Zone.

3. Go to [AWS Certificate Manager](https://console.aws.amazon.com/acm/) click o request a new Certificate
  1. In the field domain name, create a wildcard **.yourdomain.com** and click review and request.

  2. Amazon will send a confirmation email to the email linked to the domain, click on link to confirm this domain belongs to you.

4. Go to [Amazon EC2](https://console.aws.amazon.com/ec2/) in the left bar under _Network & Security_ click on Keypairs.

  1. Click on create, name your keypair and will be downloaded automatically. SAVE IT IN A SECURE PLACE OR YOU WILL NOT BE ABLE TO ACCESS THIS MACHINE AGAIN!!

5. Click on instances, launch instances, select ubuntu server 16.04 LTS, Select The instance type you desire and launch.

  1. When it's online, select your created instance and, if you don't select a security group, there's created a new one.

  2. Click on this name and you will be in Security Groups List (There's a link in left panel).

  3. Go to Inbound tab, click on edit and Add Rule for your Port Http (80) and Https (443).

6. Go to Load Balancers (Left Bar) and create a new Load Balancer, selecting Application Load Balancer and click in next.

  1. In Basic Configuration, name-it default (or anyway you like) and in listeners, add listeners to the ports 80 and 443.

  2. Select Desired Availability Zones inside your VPC and click next

  3. (Step 2) In Certificate Type, choose an existing certificate then we created in step 3. Click Next.

  4. (Step 3) Select the same Security group then you're using in your EC2 Instance.

  5. (Step 4) Select new Target Group, name it as default (or anyway you like), keep protocol http and port 80 in target group.´

  6. (Step 4) In health checks select protocol http and put a path to health status. (The AWS will ping this url to check if the server is alive)

  7. Select the machines you want to put under this load balance (We created just one for this example) and create.


7. Back [Route 53](https://console.aws.amazon.com/route53) and enter in your hosted zone (domain)

  1. Click on create record set, name it bot, type cname and check "alias" to yes

  2. In target name, find your load balance.

  3. Let policy simple and Evaluate Target Health No. Click Create

7. Remember of .pem file of step 4? Find his directory and filename and put in YOUR_KEY_DIRECTORY

  1. Connect on your machine by ssh `ssh YOUR_KEY_DIRECTORY ubuntu@YOUR_AMAZON_AWS_PUBLIC_DNS`

  2. Obs: Go to EC2 -> Instances -> Select your instance and See "Public DNS (IPV4)"

  3.If you use windows [Git Bash (Distributed with Git for Windows)](https://git-scm.com/downloads) it's an excellent choice.

8. Now you connected, run this commands

    ```Bash
    cd ~

    curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh

    sudo bash nodesource_setup.sh
    ```

  1. Then install NodeJs and NPM with

    ```Bash
    sudo apt-get install nodejs
    ```

  2. Next you need to compile some source files

    ```Bash
    sudo apt-get install build-essential
    ```

  3. You can run `npm --version` and `node --version` to check if installation is ok.

9. Install [pm2](https://github.com/Unitech/pm2) to manage process

    `npm install -g pm2`

10. [Setup Nginx and pm2](https://doesnotscale.com/deploying-node-js-with-pm2-and-nginx/)

11. Clone your project inside some server folder (i like to put into /var/app/myapp)

  1. Go to your app folder and run `npm install`

  2. Put your app into production! `pm2 start npm -- start` that's all folks!
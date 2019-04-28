
# 2018/19 Final Year Project Code part #
## Topic: Authentication of network infrastructure device using blockchain ##

<font size="4">
Two part:
<br>STD(Standard Network Devices)
<br>Auth(Authenticator)
<br>

## STD installation ##
To install STD program, you have to git clone whole project, therefore, just insert following command:
<pre>
sudo npm install
sudo npm rebuild
</pre>

<br>Next, you also have to install some Python library in order to execute the Ethernet Receiver. To test it, you need to install all the library from RecvETH.py in order to execute the program.
<br>To install the require Python program, just insert the following command:
<pre>
sudo pip install [library]
</pre>


<br>Finally, when all the step has been complete, you just need to insert the following command to run the program:
<pre>
sudo npm start(slow way, include compiler process)
sudo node build/main.ts(quick way)
</pre>


<br>
## Auth installation ##
Auth program installation is much more simple. You just have to install the npm part, not need to deal with any python installation. Since Python script just using all the standard library.
<pre>
sudo npm install
sudo npm rebuild
</pre>
<br>Then, run the program by following command.
<pre>
sudo npm start(slow way)
sudo node build/main.ts(quick way)
</pre>

<br>finally, to access the authentication interface, you just have to access the local web service by port 8008
<pre>
http://127.0.0.1:8008/
</pre>

</font>

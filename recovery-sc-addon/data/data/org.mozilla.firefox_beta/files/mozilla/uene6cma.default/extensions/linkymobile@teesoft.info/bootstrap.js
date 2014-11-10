
var LinkyMobileContent  = {
    GetPreferences: function()
    {

        this.bThorough =  false;
        try{
            this.bAutoLinkify = this.LinkyMobileContentPrefs.getBoolPref('AutoLinkify');            
        }catch(e){
            this.bAutoLinkify = true;
            this.LinkyMobileContentPrefs.setBoolPref('AutoLinkify',this.bAutoLinkify);
        }
        this.bTextColor =  false;
        this.bBackgroundColor =  false;
        this.sTextColor =  this.sDefaultTextColor;
        this.sBackgroundColor =  this.sDefaultBackgroundColor;
        this.bLinkifyImageURLs =  true;
        this.bLinkifyProtocol =  true;
        this.bLinkifyKnown =  true;
        this.bLinkifyUnknown =  true;
        this.bLinkifyEmail =  true;
        this.sProtocols =  this.sDefaultProtocol;
        this.sSubDomains =  this.sDefaultSubdomain;
        this.sInlineElements =  this.sDefaultInlineElements;
        this.sExcludeElements =  this.sDefaultExcludeElements;
        this.bUseBlacklist =  true;
        this.bUseWhitelist =  false;
        this.sSitelist =  this.sDefaultSiteList;
        try{
            this.bEnableCharLimit = this.LinkyMobileContentPrefs.getBoolPref('CharLimitEnabled');            
        }catch(e){
            this.bEnableCharLimit = false;
            this.LinkyMobileContentPrefs.setBoolPref('CharLimitEnabled',this.bEnableCharLimit);
        }
        try{
            this.nCharLimit = this.LinkyMobileContentPrefs.getIntPref('CharLimit');
        }catch(e){
            this.nCharLimit = 15000;
            this.LinkyMobileContentPrefs.setIntPref('CharLimit',this.nCharLimit);
        }        

        return true;
    },

    InitServices: function()
    {
        this.LinkyMobileContentPrefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefService).getBranch('extensions.LinkyMobile.');
        this.sDefaultTextColor = '#006620';
        this.sDefaultBackgroundColor = '#fff9ab';
        this.sDefaultProtocol = 'news:news,nntp:nntp,telnet:telnet,irc:irc,mms:mms,ed2k:ed2k,file:file,about:about!,mailto:mailto!,xmpp:xmpp!,h...s:https,f.p:ftp,h.?.?p:http,market:market';
        this.sDefaultSubdomain = 'www:http,ftp:ftp,irc:irc,jabber:xmpp!';
        this.sDefaultSiteList = 'localhost,google.com';
        this.sDefaultInlineElements = 'a,abbr,acronym,b,basefont,bdo,big,cite,code,dfn,em,font,i,kbd,label,nobr,q,s,samp,small,span,strike,strong,sub,sup,tt,u,wbr,var';
        this.sDefaultExcludeElements = "a,applet,area,embed,frame,frameset,head,iframe,img,map,meta,noscript,object,option,param,script,select,style,textarea,title,*[@onclick],*[@onmousedown],*[@onmouseup],*[@tiddler],*[@class='LinkyMobile-disabled']";
        this.nLinkified = 0;

        LinkyMobileContent.Init();
        
        //addEventListener('load', LinkyMobileContent.AutoLinkify, true);
        //addMessageListener("LinkyMobile:Linkify", LinkyMobileContent.PageActionClicked);
        return true;
    },

    Init: function()
    {
        this.GetPreferences();

        this.aExcludeElements = this.sExcludeElements.split(',');
        this.aInlineElements = this.sInlineElements.split(',');
        this.aInlineHash = Array();
        for (ctr = 0; ctr < this.aInlineElements.length; ++ctr)
        {
            this.aInlineHash[this.aInlineElements[ctr]] = true;
        }

        this.aProtocol = Array();
        this.aRecognizeProtocolAs = Array();

        var aTextLinkProtocol;
        var aTextProtocolList = this.sProtocols.split(',');
        var ctr;
        for (ctr = 0; ctr < aTextProtocolList.length; ++ctr)
        {
            aTextLinkProtocol = aTextProtocolList[ctr].split(':');
            if ((aTextLinkProtocol[0].length > 0) && (aTextLinkProtocol[1].length > 0))
            {
                if (aTextLinkProtocol[1].substr(aTextLinkProtocol[1].length - 1) == '!')
                {
                    aTextLinkProtocol[0] += ':';
                    aTextLinkProtocol[1] = aTextLinkProtocol[1].substr(0, aTextLinkProtocol[1].length - 1) + ':';
                }
                else
                {
                    aTextLinkProtocol[0] += ':\\/\\/';
                    aTextLinkProtocol[1] += '://';
                }

                this.aProtocol.push(aTextLinkProtocol[0]);
                this.aRecognizeProtocolAs.push(aTextLinkProtocol[1]);
            }
        }

        this.aSubDomain = Array();
        this.aRecognizeSubDomainAs = Array();

        var aSubdomainProtocolList = this.sSubDomains.split(',');
        for (ctr = 0; ctr < aSubdomainProtocolList.length; ++ctr)
        {
            aTextLinkProtocol = aSubdomainProtocolList[ctr].split(':');
            if ((aTextLinkProtocol[0].length > 0) && (aTextLinkProtocol[1].length > 0))
            {
                if (aTextLinkProtocol[1].substr(aTextLinkProtocol[1].length - 1) == '!')
                {
                    aTextLinkProtocol[1] = aTextLinkProtocol[1].substr(0, aTextLinkProtocol[1].length - 1) + ':';
                }
                else
                {
                    aTextLinkProtocol[1] += '://';
                }

                this.aSubDomain.push(aTextLinkProtocol[0]);
                this.aRecognizeSubDomainAs.push(aTextLinkProtocol[1]);
            }
        }

        var sProtocol = '(' + this.aProtocol.join('|') + ')';
        var sSubDomain = '(' + this.aSubDomain.join('|') + ')';

        var sAlphanumeric = '[^`~!@#$%^&*()_=+\\[{\\]}\\\\|;:\'",<.>\\/?\\s]';

        var sURLPathChars = '[^\\^\\[\\]{}|\\\\\'"<>`\\s\\(]';
        var sEndChars = '[^!@\\^()\\[\\]{}|\\\\:;\'",.?<>`\\s]';
        var sUserNamePasswordChars = '[^@:<>(){}`\'"\\/\\[\\]\\s]';
        var sGetStringChars = '[^\\^*\\[\\]{}|\\\\"<>\\/`\\s]';

        var sTopLevelDomains = '[a-z]{2,6}';
        var sIPv4Address = '(?:(?:(?:[0-1]?[0-9]?[0-9])|(?:2[0-4][0-9])|(?:25[0-5]))(?:\\.(?:(?:[0-1]?[0-9]?[0-9])|(?:2[0-4][0-9])|(?:25[0-5]))){3})';
        var sIPv6Address = '(?:[A-Fa-f0-9:]{16,39})';
        var sIPAddress = '(?:' + sIPv4Address + '|' + sIPv6Address + ')';
        var sAllSubDomain = sAlphanumeric + '+';
        var sURLPath = sURLPathChars + '*' + sEndChars;

        var sWWWAuth = '(?:(?:(?:' + sUserNamePasswordChars + '+:)?' + sUserNamePasswordChars + '+@)?' + sSubDomain + '\\.(?:' + sAllSubDomain + '\\.)+' + sTopLevelDomains + '(?:[/#?](?:' + sURLPath + ')?)?)';
        var sOtherOptionalAuth = '(?:(?:' + sUserNamePasswordChars + '+@)?(' + sIPAddress + '|(?:(?:' + sAllSubDomain + '\\.)+' + sTopLevelDomains + '))\/(?:' + sURLPath + '(?:[#?](?:' + sURLPath + ')?)?)?)';
        var sOtherAuth = '(?:' + sUserNamePasswordChars + '+:' + sUserNamePasswordChars + '+@(' + sIPAddress + '|(?:(?:' + sAllSubDomain + '\\.)+' + sTopLevelDomains + '))(?:\/(?:(?:' + sURLPath + ')?)?)?(?:[#?](?:' + sURLPath + ')?)?)';

        var sRegExpHTTP = '(?:' + sProtocol + sURLPath + ')';
        var sRegExpWWW = '(?:' + sWWWAuth + '|' + sOtherOptionalAuth + '|' + sOtherAuth + ')';
        var sRegExpEmail = '(' + sUserNamePasswordChars + '+@' + '(?:(?:(?:' + sAllSubDomain + '\\.)+' + sTopLevelDomains + ')|(?:' + sIPAddress + '))(?:' + sGetStringChars + '+' + sEndChars + ')?)';
        this.sRegExpAll = RegExp(sRegExpHTTP + '|' + sRegExpWWW + '|' + sRegExpEmail, 'i');

        sOtherOptionalAuth = '(?:(?:[^*=/<>(){}\\[\\]\\s]+@)?((' + sIPAddress + '|(?:(?:' + sAllSubDomain + '\\.)+' + sTopLevelDomains + ')))(?:/(?:' + sURLPath + ')?)?(?:[#?](?:' + sURLPath + ')?)?)';
        sRegExpWWW = '(?:' + sWWWAuth + '|' + sOtherOptionalAuth + ')';
        this.sRegExpSelected = RegExp('^(?:' + sRegExpHTTP + '|' + sRegExpEmail + '|' + sRegExpWWW + ')$', 'i');

        this.sXPath = '//text()[not(ancestor::' + this.aExcludeElements.join(' or ancestor::') + ') and (';
        for (ctr = 0; ctr < this.aSubDomain.length; ++ctr)
        {
            this.sXPath += "contains(translate(., '" + this.aSubDomain[ctr].toUpperCase() + "', '" + this.aSubDomain[ctr].toLowerCase() + "'), '" + this.aSubDomain[ctr].toLowerCase() + "') or ";
        }
        this.sXPath += "contains(., '@') or contains(., '/') or contains(., ':'))]";

        return true;
    },
    onContentLoad: function(e)
    {
        LinkyMobileContent.doAutoLinkify(e.target);
    },
    AutoLinkify: function(objEvent)
    {
        return LinkyMobileContent.doAutoLinkify(objEvent.originalTarget)
    },
    doAutoLinkify: function(ndDocument)
    {
        this.GetPreferences();
        var aBodyTags = ndDocument.getElementsByTagName('body');
        var ndBody = (aBodyTags.length > 0) ? aBodyTags[0] : false;

        if (!LinkyMobileContent.bAutoLinkify || !ndBody || (ndBody.getAttribute('linkifying') == true))
        {
            return false;
        }
        ndBody.setAttribute('linkifying', true);

        var sHost = LinkyMobileContent.GetHost(ndDocument);
        var sLocation = LinkyMobileContent.GetSiteListed(sHost);

        if ((!sLocation && LinkyMobileContent.bUseWhitelist) || (sLocation && LinkyMobileContent.bUseBlacklist))
        {
        
            return false;
        }

        
        if (LinkyMobileContent.bEnableCharLimit)
        {
            var objRange = document.createRange();
            objRange.setEnd(ndBody, ndBody.childNodes.length);
            objRange.setStart(ndBody, 0);

            var nPageLength = objRange.toString().length;
            objRange.detach();
            if (nPageLength > LinkyMobileContent.nCharLimit)
            {
                return false;
            }
        }

        if (LinkyMobileContent.bThorough)
        {
            LinkyMobileContent.Linkify_Thorough(ndDocument);
        }
        else
        {
            LinkyMobileContent.Linkify_Simple(ndDocument);
        }
        return true;
    },

    UserLinkify: function(doc)
    {
        if (this.bFromPopup)
        {
            return false;
        }

        this.bFromPopup = true;

        var ndDocument, ndBody, aBodyTags;

        this.GetWindows(doc.defaultView);
        for (var ctr = 0; ctr < this.aFrameWindows.length; ++ctr)
        {
            ndDocument = this.aFrameWindows[ctr].document;
            aBodyTags = ndDocument.getElementsByTagName('body');
            ndBody = (aBodyTags.length > 0) ? aBodyTags[0] : false;

            if (!ndBody || (ndBody.getAttribute('linkifying') == true))
            {
                continue;
            }
            ndBody.setAttribute('linkifying', true);

            if (this.nLinkified > 0)
            {
                this.Undo(ndDocument);
            }
            else
            {
                if (this.bThorough)
                {
                    this.Linkify_Thorough(ndDocument);
                }
                else
                {
                    this.Linkify_Simple(ndDocument);
                }
            }
        }

        this.bFromPopup = false;
        return true;
    },

    Linkify_Thorough: function(ndRoot)
    {
        var ndDocument = this.GetParent(ndRoot, '#document');
        var ndBody = ndDocument.getElementsByTagName('body')[0];

        var ndNode = ndRoot;
        while (ndNode.nodeName != '#document')
        {
            if (this.IsExcluded(ndDocument, ndNode))
            {
                return true;
            }
            ndNode = ndNode.parentNode;
        }
        ndNode = null;

        var objStartTime = new Date();

        ndBody.setAttribute('linkifycurrent', 0);
        ndBody.setAttribute('linkifymax', 0);
        ndBody.setAttribute('linkifytraversed', 'false');

        this.TraverseNodes(ndDocument, ndBody, ndRoot, ndRoot, false, [], '', objStartTime);

        return true;
    },

    TraverseNodes: function(ndDocument, ndBody, ndRoot, ndNode, bChildrenDone, aTraverseNodes, sTraverseText, objStartTime)
    {
        
        for (var nIterations = 0; (ndNode && (nIterations < 75)); ++nIterations)
        {
            if (ndNode.nodeName == '#text')
            {
                if (!bChildrenDone)
                {
                    aTraverseNodes.push(ndNode);
                    sTraverseText += ndNode.nodeValue;
                }
            }
            else if (aTraverseNodes.length && ndNode.nodeName && !LinkyMobileContent.aInlineHash[ndNode.nodeName.toLowerCase()])
            {
                ndBody.setAttribute('linkifymax', (parseInt(ndBody.getAttribute('linkifymax'), 10) + 1));
                LinkyMobileContent.CreateLinks_Thorough(ndDocument, ndBody, aTraverseNodes, sTraverseText, objStartTime);
                aTraverseNodes = [];
                sTraverseText = '';
            }

            if (bChildrenDone && (ndNode == ndRoot))
            {
                break;
            }
            else if (!bChildrenDone && ndNode.firstChild && !LinkyMobileContent.IsExcluded(ndDocument, ndNode))
            {
                ndNode = ndNode.firstChild;
            }
            else
            {
                if (ndNode.nextSibling)
                {
                    ndNode = ndNode.nextSibling;
                    bChildrenDone = false;
                }
                else
                {
                    ndNode = ndNode.parentNode;
                    bChildrenDone = true;
                }
            }
        }

        if (ndNode && (ndNode != ndRoot))
        {
            setTimeout(LinkyMobileContent.TraverseNodes, 20, ndDocument, ndBody, ndRoot, ndNode, bChildrenDone, aTraverseNodes, sTraverseText, objStartTime);
            return true;
        }

        LinkyMobileContent.Linkify_Thorough_End(ndDocument, objStartTime, true);
        return true;
    },

    CreateLinks_Thorough: function(ndDocument, ndBody, aTraverseNodes, sTraverseText, objStartTime)
    {
        var aMatch, sStyle, sHREF, nIndex, nTextLength, objRange, ndStart, ndEnd, nRangeStart, nRangeEnd, nSearch, ndAnchor;
        var nIterations = 0;

        while ((aMatch = LinkyMobileContent.sRegExpAll.exec(sTraverseText)) && (nIterations++ < 20))
        {
            sHREF = LinkyMobileContent.GetLinkHREF(aMatch);

            nTextLength = 0;
            nIndex = 0;
            nSearch = aMatch.index;
            while (nSearch > (nTextLength + aTraverseNodes[nIndex].nodeValue.length))
            {
                nTextLength += aTraverseNodes[nIndex++].nodeValue.length;
            }
            ndStart = aTraverseNodes[nIndex];
            nRangeStart = nSearch - nTextLength;

            nSearch = aMatch.index + aMatch[0].length;
            while (nSearch > (nTextLength + aTraverseNodes[nIndex].nodeValue.length))
            {
                nTextLength += aTraverseNodes[nIndex++].nodeValue.length;
            }
            ndEnd = aTraverseNodes[nIndex];
            nRangeEnd = nSearch - nTextLength;

            if (LinkyMobileContent.IsImage(sHREF) && (!LinkyMobileContent.bLinkifyImageURLs)
                || (aMatch[1] && !LinkyMobileContent.bLinkifyProtocol)
                || (aMatch[2] && !LinkyMobileContent.bLinkifyKnown)
                || ((aMatch[3] || aMatch[4]) && !LinkyMobileContent.bLinkifyUnknown)
                || (aMatch[5] && !LinkyMobileContent.bLinkifyEmail))
                {
                aTraverseNodes[nIndex].splitText(nSearch - nTextLength);
                aTraverseNodes[nIndex] = aTraverseNodes[nIndex].nextSibling;

                ndReturn = aTraverseNodes[nIndex];

                aTraverseNodes.splice(0, nIndex);
                sTraverseText = sTraverseText.substr(nSearch);

                continue;
            }

            objRange = document.createRange();
            objRange.setStart(ndStart, nRangeStart);
            objRange.setEnd(ndEnd, nRangeEnd);

            ndAnchor = ndDocument.createElement('a');
            ndAnchor.setAttribute('title', 'Linkification: ' + sHREF);
            ndAnchor.setAttribute('href', sHREF);
            ndAnchor.setAttribute('class', 'LinkyMobile-ext');
            sStyle = (LinkyMobileContent.bTextColor) ? 'color:' + LinkyMobileContent.sTextColor : '';
            if (LinkyMobileContent.bBackgroundColor)
            {
                sStyle += (sStyle.length > 0) ? '; ' : '';
                sStyle += 'background-color:' + LinkyMobileContent.sBackgroundColor;
            }

            if (sStyle.length > 0)
            {
                ndAnchor.setAttribute('style', sStyle);
            }

            ndAnchor.appendChild(objRange.extractContents());
            objRange.insertNode(ndAnchor);

            objRange.detach();

            ndReturn = ndAnchor.nextSibling;
            if ((ndAnchor.nextSibling) && (ndAnchor.nextSibling.nodeName == '#text'))
            {
                aTraverseNodes.splice(0, nIndex + 1, ndAnchor.nextSibling);
            }
            else
            {
                aTraverseNodes.splice(0, nIndex + 1);
            }
            sTraverseText = sTraverseText.substr(nSearch);
        }

        if (aMatch)
        {
            setTimeout(LinkyMobileContent.CreateLinks_Thorough, 10, ndDocument, ndBody, aTraverseNodes, sTraverseText, objStartTime);
            return true;
        }

        ndBody.setAttribute('linkifycurrent', (parseInt(ndBody.getAttribute('linkifycurrent'), 10) + 1));
        LinkyMobileContent.Linkify_Thorough_End(ndDocument, objStartTime, false);
        return true;
    },

    Linkify_Thorough_End: function(ndDocument, objStartTime, bTraversed)
    {
        var ndBody = ndDocument.getElementsByTagName('body')[0];

        if (bTraversed)
        {
            ndBody.setAttribute('linkifytraversed', 'true');
        }

        if ((ndBody.getAttribute('linkifytraversed') == 'false') || (parseInt(ndBody.getAttribute('linkifycurrent'), 10) != parseInt(ndBody.getAttribute('linkifymax'), 10)))
        {
            return false;
        }

        var objStopTime = new Date();

        var aAttributes = Array();
        aAttributes['class'] = 'LinkyMobile-ext';

        ndBody.setAttribute('linkified', this.GetElementsByAttributes(ndDocument, aAttributes).length);
        ndBody.setAttribute('linkifytime', (objStopTime.getTime() - objStartTime.getTime()));
        ndBody.setAttribute('linkifying', false);
        ndBody.removeAttribute('linkifytraversed');
        ndBody.removeAttribute('linkifycurrent');
        ndBody.removeAttribute('linkifymax');

        this.SetLinkified(ndDocument);

        delete objStartTime;
        delete objStopTime;
        objStartTime = objStopTime = null;
        return true;
    },

    Linkify_Simple: function(ndDocument)
    {
        var ndBody = ndDocument.getElementsByTagName('body')[0];
        var objStartTime = new Date();

        var objResult = this.XPathQuery(this.sXPath, ndDocument);

        ndBody.setAttribute('linkifycurrent', 0);
        ndBody.setAttribute('linkifymax', objResult.snapshotLength);
        

        for (var ctr = 0; ctr < objResult.snapshotLength; ++ctr)
        {
            this.CreateLinks_Simple(ndDocument, objResult.snapshotItem(ctr), ctr, objStartTime);
        }

        return true;
    },

    CreateLinks_Simple: function(ndDocument, ndText, nProgressIndex, objStartTime)
    {
        var sHREF;
        var sSource = ndText.nodeValue;
        var ndParent = ndText.parentNode;
        var ndNextSibling = ndText.nextSibling;

        for (var aMatch = null, bMatched = false, nIterations = 0, nNodeLinks = 0; (nIterations < 3) && (aMatch = LinkyMobileContent.sRegExpAll.exec(sSource)); ++nIterations)
        {
            if (!bMatched)
            {
                bMatched = true;
                ndParent.removeChild(ndText);
            }

            ndParent.insertBefore(ndDocument.createTextNode(sSource.substring(0, aMatch.index)), ndNextSibling);
            sHREF = LinkyMobileContent.GetLinkHREF(aMatch);

            if (LinkyMobileContent.IsImage(sHREF) && (!LinkyMobileContent.bLinkifyImageURLs)
                || (aMatch[1] && !LinkyMobileContent.bLinkifyProtocol)
                || (aMatch[2] && !LinkyMobileContent.bLinkifyKnown)
                || ((aMatch[3] || aMatch[4]) && !LinkyMobileContent.bLinkifyUnknown)
                || (aMatch[5] && !LinkyMobileContent.bLinkifyEmail))
                {
                ndParent.insertBefore(ndDocument.createTextNode(aMatch[0]), ndNextSibling);
                sSource = sSource.substr(aMatch.index + aMatch[0].length);
                continue;
            }

            var ndAnchor = ndDocument.createElement('a');
            ndAnchor.setAttribute('title', 'Linkification: ' + sHREF);
            ndAnchor.setAttribute('href', sHREF);
            ndAnchor.setAttribute('class', 'LinkyMobile-ext');

            var sStyle = (LinkyMobileContent.bTextColor) ? 'color:' + LinkyMobileContent.sTextColor : '';
            if (LinkyMobileContent.bBackgroundColor)
            {
                sStyle += (sStyle.length > 0) ? '; ' : '';
                sStyle += 'background-color:' + LinkyMobileContent.sBackgroundColor;
            }

            if (sStyle.length > 0)
            {
                ndAnchor.setAttribute('style', sStyle);
            }

            ndAnchor.appendChild(ndDocument.createTextNode(aMatch[0]));
            ndParent.insertBefore(ndAnchor, ndNextSibling);

            sSource = sSource.substr(aMatch.index + aMatch[0].length);
            ++nNodeLinks;
        }

        if (bMatched)
        {
            var ndAfter = ndDocument.createTextNode(sSource);
            ndParent.insertBefore(ndAfter, ndNextSibling);
        }

        if (nIterations == 3)
        {
            if (ndDocument && ndDocument.defaultView)
                ndDocument.defaultView.setTimeout(LinkyMobileContent.CreateLinks_Simple, 20, ndDocument, ndAfter, nProgressIndex, objStartTime);
            return true;
        }

        var ndBody = ndDocument.getElementsByTagName('body')[0];
        var nLinkified = parseInt(ndBody.getAttribute('linkifycurrent'), 10);
        ndBody.setAttribute('linkifycurrent', (nLinkified + 1));

        if ((nLinkified + 1) < parseInt(ndBody.getAttribute('linkifymax'), 10))
        {
            return true;
        }

        LinkyMobileContent.Linkify_Simple_End(ndDocument, objStartTime);
        return true;
    },

    Linkify_Simple_End: function(ndDocument, objStartTime)
    {
        var ndBody = ndDocument.getElementsByTagName('body')[0];

        var objStopTime = new Date();

        var aAttributes = Array();
        aAttributes['class'] = 'LinkyMobile-ext';

        ndBody.setAttribute('linkified', this.GetElementsByAttributes(ndDocument, aAttributes).length);
        ndBody.setAttribute('linkifytime', objStopTime.getTime() - objStartTime.getTime());
        ndBody.setAttribute('linkifying', false);
        ndBody.removeAttribute('linkifycurrent');
        ndBody.removeAttribute('linkifymax');

        this.SetLinkified(ndDocument);

        delete objStartTime;
        delete objStopTime;
        objStartTime = objStopTime = null;
        return true;
    },


    GetLinkHREF: function(aMatch)
    {
        var sHREF = '';
        if (aMatch[1])
        {
            sHREF = aMatch[0].replace(aMatch[1], this.GetProtocol(aMatch[1]));
            if (sHREF.match(/^http:\/\/anonym\.to\/?\?.+/i)) sHREF = sHREF.replace(/^http:\/\/anonym\.to\/?\?/i, '');
        }
        else if (aMatch[2])
        {
            sHREF = this.GetDomainProtocol(aMatch[2]) + aMatch[0];
        }
        else if (aMatch[3])
        {
            sHREF = this.GetDomainProtocol(aMatch[3]) + aMatch[0];
        }
        else if (aMatch[4])
        {
            sHREF = this.GetDomainProtocol(aMatch[4]) + aMatch[0];
        }
        else if (aMatch[5])
        {
            sHREF = 'mailto:' + aMatch[0];
        }

        return sHREF;
    },

    Undo: function(ndDocument)
    {
        var ndBody = ndDocument.getElementsByTagName('body')[0];
        if (ndBody.getAttribute('linkifying') == true)
        {
            return true;
        }
        ndBody.setAttribute('linkifying', true);

        var ndParent;

        var aAttributes = Array();
        aAttributes['class'] = 'LinkyMobile-ext';
        var aAnchors = this.GetElementsByAttributes(ndDocument, aAttributes);

        for (var ctr = aAnchors.length - 1; ctr >= 0; --ctr)
        {
            ndParent = aAnchors[ctr].parentNode;
            while (aAnchors[ctr].firstChild)
            {
                ndParent.insertBefore(aAnchors[ctr].removeChild(aAnchors[ctr].firstChild), aAnchors[ctr]);
            }
            ndParent.removeChild(aAnchors[ctr]);
        }

        ndBody.removeAttribute('linkified');
        ndBody.removeAttribute('linkifytime');
        ndBody.setAttribute('linkifying', false);

        this.SetLinkified(ndDocument);

        return true;
    },

    GetProtocol: function(sProtocolMatch)
    {
        var reTest;
        for (var ctr = 0; ctr < this.aProtocol.length; ++ctr)
        {
            reTest = RegExp('^' + this.aProtocol[ctr] + '$', 'i');
            if (reTest.test(sProtocolMatch))
            {
                return this.aRecognizeProtocolAs[ctr];
            }
        }

        return true;
    },

    GetDomainProtocol: function(sSubdomain)
    {
        var reTest;
        for (var ctr = 0; ctr < this.aSubDomain.length; ++ctr)
        {
            reTest = RegExp('^' + this.aSubDomain[ctr] + '$', 'i');
            if (reTest.test(sSubdomain))
            {
                return this.aRecognizeSubDomainAs[ctr];
            }
        }

        return 'http://';
    },

    IsImage: function(sFile)
    {
        sFile = (sFile.indexOf('?') > -1) ? sFile.substr(0, sFile.indexOf('?')) : sFile;
        sFile = (sFile.indexOf('#') > -1) ? sFile.substr(0, sFile.indexOf('#')) : sFile;
        sFile = (sFile.lastIndexOf('.') > -1) ? sFile.substr(sFile.lastIndexOf('.')) : sFile;

        return ((sFile == '.jpeg') || (sFile == '.jpg') || (sFile == '.gif') || (sFile == '.png') || (sFile == '.bmp'));
    },

    SetLinkified: function(doc)
    {
        this.nLinkified = 0;
        this.nLinkifyTime = 0;

        var ndDocument, ndBody, aBodyTags;

        this.GetWindows(doc.defaultView);
        for (var ctr = 0; ctr < this.aFrameWindows.length; ++ctr)
        {
            ndDocument = this.aFrameWindows[ctr].document;
            aBodyTags = ndDocument.getElementsByTagName('body');
            ndBody = (aBodyTags.length > 0) ? aBodyTags[0] : false;

            if (ndBody === false)
            {
                continue;
            }

            if (ndBody.hasAttribute && ndBody.hasAttribute('linkified') && ndBody.getAttribute('linkified'))
            {
                this.nLinkified += parseInt(ndBody.getAttribute('linkified'), 10);
                this.nLinkifyTime += parseInt(ndBody.getAttribute('linkifytime'), 10);
            }
        }

        //        var ndStatus = document.getElementById('LinkyMobile-status-hbox');
        //        if (this.nLinkified > 0)
        //        {
        //            ndStatus.setAttribute('tooltiptext', this.objStringBundle.getString('linkification_statusbartooltip') + ' ' + this.nLinkified + ' (' + parseInt(this.nLinkifyTime, 10) + 'ms)');
        //        }
        //        else
        //        {
        //            ndStatus.setAttribute('tooltiptext', this.objStringBundle.getString('linkification_statusbartooltip') + ' ' + this.nLinkified);
        //        }
        //        ndStatus.src = (this.nLinkified > 0) ? 'chrome://LinkyMobile/skin/link-on.png' : 'chrome://LinkyMobile/skin/link-off.png';

        return true;
    },

    GetWindows: function(ndWindow)
    {
        if (ndWindow == ndWindow.top)
        {
            this.aFrameWindows = Array();
            this.aFrameWindows.push(ndWindow);
        }

        for (var ctr = 0; ctr < ndWindow.frames.length; ++ctr)
        {
            this.aFrameWindows.push(ndWindow.frames[ctr]);

            if (ndWindow.frames[ctr].frames.length > 0)
            {
                this.GetWindows(ndWindow.frames[ctr]);
            }
        }

        return true;
    },

    GetElementsByAttributes: function(ndDocument, aAttributes)
    {
        var sAttributeName;

        var sQuery = '';
        for (sAttributeName in aAttributes)
        {
            sQuery += '(//node()[@' + sAttributeName;
            sQuery += (aAttributes[sAttributeName].length > 0) ? "='" + aAttributes[sAttributeName] + "'" : '';
            sQuery += ']) or ';
        }
        sQuery = sQuery.substring(0, sQuery.length - 4);
        var objResult = this.XPathQuery(sQuery, ndDocument);

        var aNodes = Array();
        for (var ctr = 0; ctr < objResult.snapshotLength; ++ctr)
        {
            aNodes.push(objResult.snapshotItem(ctr));
        }

        return aNodes;
    },

    XPathQuery: function(sQuery, ndDocument)
    {
        var ndOwnerDocument = (ndDocument.ownerDocument == null) ? ndDocument.documentElement : ndDocument.ownerDocument.documentElement;
        if (ndOwnerDocument.namespaceURI) sQuery = sQuery.replace('ancestor::', 'ancestor::xhtml:');

        var objXPE = ndDocument;// new XPathEvaluator();
        var objNSResolver = function(prefix) {
            return 'http://www.w3.org/1999/xhtml';
        };
        var objResult = objXPE.evaluate(sQuery, ndDocument, objNSResolver, 7 /*XPathResult.ORDERED_NODE_SNAPSHOT_TYPE*/, null);
        //delete objXPE;
        //objXPE = null;

        return objResult;
    },

    GetHost: function(ndDocument)
    {
        var sHost;
        if (!ndDocument)
        {
            var objURI = Browser.selectedBrowser.webNavigation.currentURI;
            try
            {
                sHost = objURI.host;
            }
            catch(sError)
            {
                return false;
            }
        }
        else
        {
            sHost = ndDocument.location.href;
            var nProtocol = sHost.indexOf('://');
            if (nProtocol == -1)
            {
                return false;
            }

            sHost = sHost.substr(nProtocol + 3);

            var nSlash = sHost.indexOf('/');
            sHost = (nSlash == -1) ? sHost : sHost.substr(0, nSlash);
        }

        return sHost;
    },

    GetSiteListed: function(sHost)
    {
        var aSiteList = this.sSitelist.split(',');

        if (!sHost)
        {
            return false;
        }

        for (var ctr = 0; ctr < aSiteList.length; ++ctr)
        {
            if (sHost.lastIndexOf(aSiteList[ctr]) > -1)
            {
                return aSiteList[ctr];
            }
        }

        return false;
    },

    PageActionClicked: function(e)
    {
        try{
            LinkyMobileContent.UserLinkify();
        }catch(e)
        {
            LinkyMobileContent.consoleError(e);
        }
        return true;
    },

    IsExcluded: function(ndDocument, ndNode)
    {
        if (ndNode.nodeName == '#text')
        {
            ndNode = ndNode.parentNode;
        }

        if (ndNode.setAttribute)
        {
            ndNode.setAttribute('LinkyMobile-marker', '');
            var sQuery = '//node()[self::*[@LinkyMobile-marker] and (self::' + this.aExcludeElements.join(' or self::') + ')]';
            var objResult = this.XPathQuery(sQuery, ndDocument);
            ndNode.removeAttribute('LinkyMobile-marker');

            return (objResult.snapshotLength > 0);
        }

        return false;
    },

    GetParent: function(ndNode, sNodeName)
    {
        sNodeName = sNodeName.toLowerCase();
        while (ndNode.nodeName.toLowerCase() != '#document')
        {
            if (ndNode.nodeName.toLowerCase() == sNodeName)
            {
                return ndNode;
            }

            ndNode = ndNode.parentNode;
        }

        return (sNodeName == '#document') ? ndNode : false;
    },

    onLoad: function() {
        try{
            LinkyMobileContent.InitServices();
        }catch(e)
        {
            LinkyMobileContent.consoleError(e);
        }
    },
    consoleLog: function(message) {
        var consoleService = Components.classes['@mozilla.org/consoleservice;1']
        .getService(Components.interfaces.nsIConsoleService);
        consoleService.logStringMessage(message)
    },
    consoleError: function(e) {
        if (e && e.stack)
            Components.utils.reportError(e + "@" + e.stack)
        else
            Components.utils.reportError(e)
    }
};

LinkyMobileContent.onLoad();


const Cc = Components.classes;
const Ci = Components.interfaces;
 
function isNativeUI() {
  let appInfo = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
  return (appInfo.ID == "{aa3c5121-dab2-40e2-81ca-7ea25febc110}");
}
 
var menuId;
function loadIntoWindow(window) {
  if (!window)
    return;
  if (isNativeUI())
    menuId = window.NativeWindow.menu.add("Converts Text Links", null, function() { LinkyMobileContent.UserLinkify(window.content.document); });  

  window.addEventListener("DOMContentLoaded",LinkyMobileContent.onContentLoad, false);
}
 
function unloadFromWindow(window) {
  if (!window)
    return;
  if (isNativeUI())
    window.NativeWindow.menu.remove(menuId);
  window.removeEventListener("DOMContentLoaded",LinkyMobileContent.onContentLoad, false);
}

var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function() {
      domWindow.removeEventListener("load", arguments.callee, false);
      loadIntoWindow(domWindow);
    }, false);
  },
  
  onCloseWindow: function(aWindow) {},
  onWindowTitleChange: function(aWindow, aTitle) {}
};
 
function startup(aData, aReason) {
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
 
  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }
 
  // Load into any new windows
  wm.addListener(windowListener);
}
 
function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;
 
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
 
  // Stop listening for new windows
  wm.removeListener(windowListener);
 
  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}
 
function install(aData, aReason) {}
function uninstall(aData, aReason) {}

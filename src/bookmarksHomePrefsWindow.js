/*
   id's of elements in document are equal to corresponding preferences
 */
var bMHPrefsWindow = null;

function BMHPrefsWindow() {
    // general
    this.hideEnginesField = document.getElementById( "hideSearchEngines" );
    this.engineMenu = document.getElementById( "engine" );
    // changed hyphens in id to underscores because of bug
    /*
       this.tMCPField = document.getElementById( "table_main_cellpadding" );
       this.tCCSField = document.getElementById( "table_column_cellspacing" );
     */
    this.nrOfColumnsField = document.getElementById( "nrOfColumns" );
    this.maxNameLengthField = document.getElementById( "maxNameLength" );
    this.maxHeaderLinesField = document.getElementById( "maxHeaderLines" );
    this.openFolderInGroup = document.getElementById( "openFolderIn" );

    // style
    this.stylesheetField = document.getElementById( "stylesheet" );
    this.stylesArray = new Array();
    this.stylesMenu = document.getElementById( "styles" );
    this.stylesDS = null;

    // folders 
    this.excludeMenu = document.getElementById( "excludeIndex" );
    this.contentFrame = document.getElementById( "folderFrame" ).contentWindow;
    this.inOrExcludedFoldersBox = this.contentFrame.document.getElementById( "inOrExcludedFolders" );
    this.subfolderCheckbox = document.getElementById( "subfolderCheckbox" );
    this.folderCheckboxArray = new Array();

    // minimum values for integer text fields
    this.minValues = new Array();
    /*
       this.minValues["table_main_cellpadding"] = 0;
       this.minValues["table_column_cellspacing"] = 0;
     */
    this.minValues["nrOfColumns"] = 1;
    this.minValues["maxNameLength"] = 1;
    this.minValues["maxHeaderLines"] = 1;

    this.init();
}


BMHPrefsWindow.prototype = {

init: function() {
	  // general
	  var popup = document.getElementById( "enginePopup" );
	  var item;
	  for( var i = 0; i < bMHPrefs.engines.length; i++ ) {
	      item = document.createElement( "menuitem" );
	      item.setAttribute( "label", bMHPrefs.engines[i].name );
	      popup.appendChild( item );
	  }
	  this.engineMenu.selectedIndex = bMHPrefs.getPref( "engine" );
	  /*
	     this.tMCPField.value = bMHPrefs.getPref( "table_main_cellpadding" ); 
	     this.tCCSField.value = bMHPrefs.getPref( "table_column_cellspacing" );
	   */
	  this.nrOfColumnsField.value = bMHPrefs.getPref( "nrOfColumns" );
	  this.maxNameLengthField.value = bMHPrefs.getPref( "maxNameLength" );
	  this.maxHeaderLinesField.value = bMHPrefs.getPref( "maxHeaderLines" );
	  this.openFolderInGroup.selectedIndex = bMHPrefs.getPref( "openFolderIn" );

	  // style
	  this.stylesheetField.action = 1;
	  this.initStyle();

	  // folders
	  this.excludeMenu.selectedIndex = bMHPrefs.getPref( "excludeIndex" );
	  this.parseBookmarks();
      },

apply: function() {
	   var prefs = new Array( bMHPrefs.getNrOfPrefs() );
	   var prefIndex = -1;
	   try {
	       // general
	       prefs[++prefIndex] = this.parseValue( this.hideEnginesField.id, this.hideEnginesField.checked );
	       prefs[++prefIndex] = this.parseValue( this.engineMenu.id, this.engineMenu.selectedIndex );
	       /*
		  prefs[++prefIndex] = this.parseValue( this.tMCPField.id, this.tMCPField.value );
		  prefs[++prefIndex] = this.parseValue( this.tCCSField.id, this.tCCSField.value );
		*/
	       prefs[++prefIndex] = this.parseValue( this.nrOfColumnsField.id, this.nrOfColumnsField.value );
	       prefs[++prefIndex] = this.parseValue( this.maxNameLengthField.id, this.maxNameLengthField.value );
	       prefs[++prefIndex] = this.parseValue( this.openFolderInGroup.id, this.openFolderInGroup.selectedIndex );
	       prefs[++prefIndex] = this.parseValue( this.maxHeaderLinesField.id, this.maxHeaderLinesField.value );
	       // no preferences for style
	       // folders
	       prefs[++prefIndex] = this.parseValue( this.excludeMenu.id, this.excludeMenu.selectedIndex );
	       // get checked folder checkboxes
	       var checkedBoxes = this.contentFrame.document.getElementsByAttribute( "checked", "true" );
	       var sortedInOrExcludedFolders = new Array( checkedBoxes.length ); 
	       var i, checkedIndex;
	       // get ancestor string for checked folder checkboxes
	       for( i = 0; i < checkedBoxes.length; i++ ) {
		   var checkedIndex = parseInt( checkedBoxes[i].id.substr( 3 ));
		   sortedInOrExcludedFolders[i] = this.folderCheckboxArray[checkedIndex].value.toString();
	       }
	       // sort excluded folders for binary search
	       sortedInOrExcludedFolders.sort();
	       var inOrExcludedString = "";
	       for ( i = 0; i < sortedInOrExcludedFolders.length; i++ ) {
		   inOrExcludedString += ( "|" + sortedInOrExcludedFolders[i] );
	       }
	       if( inOrExcludedString.length > 0 ) {
		   // remove first bar
		   inOrExcludedString = inOrExcludedString.substr( 1 );
	       }
	       prefs[++prefIndex] = this.parseValue( this.inOrExcludedFoldersBox.id, inOrExcludedString );
	       // set prefs
	       for( prefIndex = 0; prefIndex < prefs.length; prefIndex++ ) {
		   bMHPrefs.setPref( prefs[prefIndex].name, prefs[prefIndex].type, prefs[prefIndex].value );
	       }
	       // apply prefs
	       window.opener.location.reload();
	       // reset style in options window
	       this.stylesMenu.selectedIndex = 0;
	       this.stylesheetField.value = this.stylesArray[0].sheet;
	       // write stylesfile
	       this.flushStylesDS();
	   }
	   catch( exception ) {
	       // inproper value in field
	       alert( exception );
	   }
       },

parseValue: function( name, value ) {
		var type = bMHPrefs.getPrefType( name );
		var minVal = this.minValues[name];
		if( minVal == null ) {
		    // value does not need to be checked
		    return { name: name, type: type, value: value };
		}
		value = parseInt( value );
		if( isNaN( value ) || value < minVal ) {
		    throw name + " does not have a proper value";
		}
		return { name: name, type: type, value: value };
	    },

close: function() {
	   window.close();
       },

hideEngines: function() {
		 document.getElementById( "engineRow" ).hidden = this.hideEnginesField.checked;
	     },

initStyle: function() {
	       // get styles datasource
	       this.stylesDS = bMHPrefs.getStylesDS();
	       // RDF variables
	       var RDF = bMHPrefs.getRDF(); 
	       var sheetArc = RDF.GetResource( bMHPrefs.stylesNS + "sheet" );
	       var nameArc = RDF.GetResource( bMHPrefs.stylesNS + "name" );
	       var stylesList = RDF.GetResource( bMHPrefs.stylesNS + "stylesList" );
	       var RDFC = bMHPrefs.getRDFC(); 
	       RDFC.Init( this.stylesDS, stylesList );
	       var stylesEnum = RDFC.GetElements();
	       // other variables
	       var stylesMenupopup = document.getElementById( "sheetNames" ); 
	       var curNode, curNameNode, curSheetNode, stylesMenuitem;
	       var index = 0;
	       // fill menu and array with styles
	       while( stylesEnum.hasMoreElements() ) {
		   curNode = stylesEnum.getNext();
		   curNameNode = this.stylesDS.GetTarget( curNode, nameArc, true );
		   if( curNameNode instanceof Components.interfaces.nsIRDFLiteral ) {
		       stylesMenuitem = document.createElement( "menuitem" );
		       stylesMenuitem.setAttribute( "label", curNameNode.Value );
		       stylesMenupopup.appendChild( stylesMenuitem );
		       curSheetNode = this.stylesDS.GetTarget( curNode, sheetArc, true );
		       if( curSheetNode instanceof Components.interfaces.nsIRDFLiteral ) {
			   this.stylesArray[index] = { name: curNameNode.Value, sheet: 
			       bMHPrefs.formatSheet( curSheetNode.Value ) };
			   index += 1;
		       }

		   }
	       }
	       this.stylesMenu.selectedIndex = 0;
	       this.stylesheetField.value = this.stylesArray[0].sheet;
	       // set color in colorpicker
	       var color = "#FF0000";
	       document.getElementsByTagName( "colorpicker" )[0].color = color;
	       this.showColor( color ); 
	   },

flushStylesDS: function() {
		   var stylesFile = bMHPrefs.getStylesFile();
		   var stylesFileURL = bMHPrefs.getStylesFileURL( stylesFile );
		   this.stylesDS.QueryInterface( Components.interfaces.nsIRDFRemoteDataSource )
		       .FlushTo( stylesFileURL );
	       },



updateStyle: function( action ) {
		 switch( action ) {
		     case 1:
			 // update style with timeout, set action prop to 2 
			 this.stylesheetField.action = 2;
			 window.setTimeout( "bMHPrefsWindow.updateStyle( 3 )", 150 );
			 break;
		     case 2:
			 // waiting for update, do nothing  
			 break;
		     case 3: 
			 // execute update, set action prop to 1
			 if( ! window.opener.closed ) {
			     var styleNode = opener.document.getElementsByTagName( "style" )[0];
			     styleNode.innerHTML = this.stylesheetField.value;
			     this.stylesheetField.action = 1;
			 }
			 break;
		 }
	     },

changeSheetProperty: function( name, index ) { 
			 var RDF = bMHPrefs.getRDF();
			 var sheetArc = RDF.GetResource( bMHPrefs.stylesNS + "sheet" ); 
			 // get resources for style
			 var styleResource = RDF.GetResource( bMHPrefs.stylesNS + name );
			 var oldSheet = this.stylesDS.GetTarget( styleResource, sheetArc, true );
			 var newSheet = RDF.GetLiteral( this.stylesheetField.value );
			 // change styles datasource
			 this.stylesDS.Change( styleResource, sheetArc, oldSheet, newSheet );
			 // change styles array
			 this.stylesArray[index].sheet = this.stylesheetField.value;
			 // change styles menu
			 if( name != "Default" ) {
			     this.stylesMenu.selectedIndex = index;
			 }
		     },

getPromptService: function() {
		      return Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			  .getService( Components.interfaces.nsIPromptService );
		  },

addAsPrompt: function() {
		 var promptService = this.getPromptService();
		 var name = { value: this.getCurStyleName() };
		 var replaceOk, i;
		 // prompt until user has given new name or wants to change the style 
		 // of existing name
		 while( promptService.prompt( this, "Add Style As", "Style name:", 
			     name, null, {value:0} )) {
		     replaceOk = true;
		     for( i = 0; i < this.stylesArray.length; i++ ) {
			 // check if name already exists
			 if( name.value == this.stylesArray[i].name ) {
			     replaceOk = promptService.confirm( this, "Style exists", 
				     name.value + " already exists. Do you want to replace it?" );
			     if( replaceOk ) {
				 // change style belonging to name
				 return this.changeSheetProperty( name.value, i );
			     }
			     break;
			 }
		     }
		     if( replaceOk ) {
			 // if user has not cancelled replacement, name does not exist yet 
			 // and should be added
			 return this.addStyleAs( name.value );
		     }
		 }
	     },

setAsDefault: function() {
		  this.changeSheetProperty( "Default", 0 );
	      },

addStyleAs: function( name ) {
		var RDF = bMHPrefs.getRDF();
		var nameArc = RDF.GetResource( bMHPrefs.stylesNS + "name" );
		var sheetArc = RDF.GetResource( bMHPrefs.stylesNS + "sheet" );
		// create resource for new style
		var newStyle = RDF.GetResource( bMHPrefs.stylesNS + name );
		var nameNode = RDF.GetLiteral( name );
		var sheetNode = RDF.GetLiteral( this.stylesheetField.value );
		var RDFC = bMHPrefs.getRDFC();
		var stylesList = RDF.GetResource( bMHPrefs.stylesNS + "stylesList" );
		RDFC.Init( this.stylesDS, stylesList );
		// append new style to styles list in styles datasource
		RDFC.AppendElement( newStyle );  
		// set properties in datasource of new style 
		this.stylesDS.Assert( newStyle, nameArc, nameNode, true ); 
		this.stylesDS.Assert( newStyle, sheetArc, sheetNode, true ); 
		// update styles array
		this.stylesArray.push( { name: name, sheet: this.stylesheetField.value } );
		// update styles list in options window 
		var stylesMenupopup = document.getElementById( "sheetNames" ); 
		stylesMenuitem = document.createElement( "menuitem" );
		stylesMenuitem.setAttribute( "label", name );
		stylesMenupopup.appendChild( stylesMenuitem );
		this.stylesMenu.selectedIndex = this.stylesArray.length - 1;
	    },

deletePrompt: function() {
		  var name = this.getCurStyleName();
		  // don't delete default style
		  if( name == "Default" ) {
		      alert( "Default style cannot be deleted" );
		  }
		  else {
		      var promptService = this.getPromptService();
		      if( promptService.confirm( this, "Delete Style", 
				  "Are you sure you want to delete " + name + "?" )) {
			  this.deleteStyle();
		      }
		  }
	      },

deleteStyle: function() {
		 var index = this.stylesMenu.selectedIndex;
		 var name = this.stylesArray[index].name;
		 // get resources for style
		 var RDF = bMHPrefs.getRDF();
		 var styleResource = RDF.GetResource( bMHPrefs.stylesNS + name );
		 var nameArc = RDF.GetResource( bMHPrefs.stylesNS + "name" );
		 var sheetArc = RDF.GetResource( bMHPrefs.stylesNS + "sheet" );
		 var nameNode = this.stylesDS.GetTarget( styleResource, nameArc, true );
		 var sheetNode = this.stylesDS.GetTarget( styleResource, sheetArc, true );
		 // delete all properties of style from datasource 
		 this.stylesDS.Unassert( styleResource, nameArc, nameNode );
		 this.stylesDS.Unassert( styleResource, sheetArc, sheetNode );
		 // get stylesList
		 var stylesList = RDF.GetResource( bMHPrefs.stylesNS + "stylesList" );
		 var RDFC = bMHPrefs.getRDFC();
		 RDFC.Init( this.stylesDS, stylesList );
		 // remove style from list
		 RDFC.RemoveElement( styleResource, true );  
		 // update styles array
		 this.stylesArray.splice( index, 1 );
		 // update options window (default == 0 so index - 1 >= 0)
		 this.stylesMenu.selectedIndex = index - 1;
		 this.changeStyle();
		 var stylesMenupopup = document.getElementById( "sheetNames" );
		 stylesMenupopup.removeChild( stylesMenupopup.childNodes[index] );
	     },

getCurStyleName: function() {
		     var index = this.stylesMenu.selectedIndex;
		     return this.stylesArray[index].name;
		 },

showColor: function( color ) {
	       document.getElementById('hexColor').value = color;
	   },

changeStyle: function() {
		 this.stylesheetField.value = this.stylesArray[this.stylesMenu.selectedIndex].sheet;
		 this.updateStyle( 3 );
	     },

parseBookmarks: function() {
		    // RDF variables
		    var RDF = bMHPrefs.getRDF();
		    var RDFC = bMHPrefs.getRDFC();
		    var RDFCU = bMHPrefs.getRDFCU();

		    var BMDS  = RDF.GetDataSource("rdf:bookmarks");
		    var root = RDF.GetResource( "NC:BookmarksRoot" );
		    var NameArc = RDF.GetResource( bMHPrefs.NC_NS + "Name" );

		    var curNameNode = BMDS.GetTarget( root, NameArc, true );
		    var curFolder;
		    if( curNameNode instanceof Components.interfaces.nsIRDFLiteral ) {
			curFolder = { node: root, ancestors: [curNameNode.Value] };
		    }
		    var folderStack = new Array( curFolder );
		    var inOrExcludedFolders = bMHPrefs.getPref( "inOrExcludedFolders" ).split( "|" );
		    var excludePref = bMHPrefs.getPref( "excludeIndex" );
		    var exclude = ( excludePref == 0 ? true : false );
		    var enumerator, tempFolders, curNode; 
		    var curNodeAncestors, isChecked, isExcluded, i;

		    while( folderStack.length > 0 ) {
			curFolder = folderStack.pop();
			RDFC.Init( BMDS, curFolder.node );
			enumerator = RDFC.GetElements();
			tempFolders = new Array();
			while( enumerator.hasMoreElements() ) {
			    curNode = enumerator.getNext();
			    curNameNode = BMDS.GetTarget( curNode, NameArc, true );
			    if( curNameNode instanceof Components.interfaces.nsIRDFLiteral ) { 
				if( RDFCU.IsSeq( BMDS, curNode )) {
				    curNodeAncestors = curFolder.ancestors.concat( [curNameNode.Value] );
				    tempFolders.push( { node: curNode, ancestors: curNodeAncestors } );
				}
			    }
			}
			isExcluded = bMHPrefs.isExcludedFolder( curFolder.ancestors.toString(),
				excludePref, inOrExcludedFolders );
			isChecked = ( exclude == isExcluded ? true : false );
			this.createFolder( curFolder.ancestors, isChecked ); 
			// reverse to match order in bookmarks tree
			folderStack = folderStack.concat( tempFolders.reverse() );
		    }
		},

createFolder: function( ancestors, isChecked ) {  
		  // hbox for checkbox and indentation spacer
		  var folderBox = this.contentFrame.document.createElement( "hbox" );
		  this.inOrExcludedFoldersBox.appendChild( folderBox );
		  // spacer
		  var indentFolderSpacer = this.contentFrame.document.createElement( "spacer" );
		  indentFolderSpacer.setAttribute( "style", "width:" + (ancestors.length*35) + "px" );
		  folderBox.appendChild( indentFolderSpacer );
		  // checkbox
		  var folderCheckbox = this.contentFrame.document.createElement( "checkbox" );
		  folderCheckbox.setAttribute( "id", "fcb" + this.folderCheckboxArray.length );
		  folderCheckbox.setAttribute( "label", ancestors[ancestors.length-1] );
		  folderCheckbox.setAttribute( "checked", isChecked );
		  folderBox.appendChild( folderCheckbox );
		  // add checkbox to array
		  this.folderCheckboxArray.push( { node: folderCheckbox, value: ancestors } );
	      },

checkSubfolders: function( node ) {
		     if( document.getElementById( "subfolderCheckbox" ).checked ) {
			 // id is "fcb" + index
			 var startIndex = parseInt( node.id.substr( 3 ));
			 var regExp = new RegExp( "^" + this.folderCheckboxArray[startIndex].value );
			 var i = startIndex + 1;
			 while( i < this.folderCheckboxArray.length &&
				 regExp.test( this.folderCheckboxArray[i].value )) {
			     this.folderCheckboxArray[i].node.checked = 
				 this.folderCheckboxArray[startIndex].node.checked;
			     i++;
			 }
		     }
		 }
}


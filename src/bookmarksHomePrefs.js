var bMHPrefs = {

defaults: [{ name: "hideSearchEngines", type: 128, value: false },
	  { name: "engine", type: 64, value: 0 },
	  /*
	  { name: "table_main_cellpadding", type: 64, value: 10 },
	  { name: "table_column_cellspacing", type: 64, value: 5 },
	  */
	  { name: "nrOfColumns", type: 64, value: 3 },
	  { name: "maxNameLength", type: 64, value: 25 },
	  { name: "maxHeaderLines", type: 64, value: 2 },
	  { name: "openFolderIn", type: 64, value: 0 },
	  { name: "excludeIndex", type: 64, value: 0 },
	  { name: "inOrExcludedFolders", type: 32, value: "" }],

engines: [{name: "Google", value: "www.google.com/search?q=" },
	 { name: "Yahoo", value: "search.yahoo.com/bin/search?p=" },
	 { name: "Ask Jeeves", value: "web.ask.com/web?q=" },
	 { name: "dmoz.org", value: "search.dmoz.org/cgi-bin/search?search=" }],

init: function() {
	  var branch = Components.classes["@mozilla.org/preferences-service;1"]
	      .getService( Components.interfaces.nsIPrefService )
	      .getBranch( "bookmarkshome." );
	  var dflt;
	  for( var i = 0; i < bMHPrefs.defaults.length; i++ ) {
	      dflt = bMHPrefs.defaults[i];
	      if( ! branch.prefHasUserValue( dflt.name )) {
		  bMHPrefs.setPref( dflt.name, dflt.type, dflt.value );
	      }
	  }
      },

getNrOfPrefs: function() {
		  return bMHPrefs.defaults.length;
	      },

getPrefType: function( name ) {
		 var branch = Components.classes["@mozilla.org/preferences-service;1"]
		     .getService( Components.interfaces.nsIPrefService )
		     .getBranch( "bookmarkshome." );
		 return branch.getPrefType( name );
	     },


getPref: function( name ) {
	     var branch = Components.classes["@mozilla.org/preferences-service;1"]
		 .getService( Components.interfaces.nsIPrefService )
		 .getBranch( "bookmarkshome." );
	     var type = branch.getPrefType( name );
	     if( type == branch.PREF_STRING ) {
		 return branch.getCharPref( name );
	     }
	     else if( type == branch.PREF_INT ) {
		 return branch.getIntPref( name ); 
	     }
	     else if( type == branch.PREF_BOOL ) {
		 return branch.getBoolPref( name );
	     }
	 },

setPref: function( name, type, value ) {
	     var branch = Components.classes["@mozilla.org/preferences-service;1"]
		 .getService( Components.interfaces.nsIPrefService )
		 .getBranch( "bookmarkshome." );
	     if( type == branch.PREF_STRING ) {
		 branch.setCharPref( name, value );
	     }
	     else if( type == branch.PREF_INT ) {
		 branch.setIntPref( name, value ); 
	     }
	     else if( type == branch.PREF_BOOL ) {
		 branch.setBoolPref( name, value );
	     }
	 },

	 // rdf namespaces
NC_NS: "http://home.netscape.com/NC-rdf#",
stylesNS: "http://bookmarkshome.mozdev.org/rdf/styles/",

getRDF: function() {
	    return Components.classes["@mozilla.org/rdf/rdf-service;1"]
		.getService( Components.interfaces.nsIRDFService );
	},

getRDFC: function() {
	     return Components.classes["@mozilla.org/rdf/container;1"]
		 .createInstance( Components.interfaces.nsIRDFContainer );
	 },

getRDFCU: function() {
	      return Components.classes["@mozilla.org/rdf/container-utils;1"]
		  .getService( Components.interfaces.nsIRDFContainerUtils );
	  },

getStylesFile: function() {
		   // get path to profile folder to retrieve/save rdf styles file
		   var  profileDirString = Components.classes["@mozilla.org/file/directory_service;1"] 
		       .getService( Components.interfaces.nsIProperties )
		       .get( "ProfD", Components.interfaces.nsIFile )
		       .QueryInterface( Components.interfaces.nsILocalFile )
		       .path; 
		   // create rdf styles file instance and initialize
		   stylesFile = Components.classes["@mozilla.org/file/local;1"].createInstance();
		   if( stylesFile instanceof Components.interfaces.nsILocalFile ) {
		       stylesFile.initWithPath( profileDirString );
		       stylesFile.append( "styles.rdf" );
		   }
		   return stylesFile;
	       },

getStylesFileURL: function( stylesFile ) {
		      return Components.classes["@mozilla.org/network/io-service;1"]
			  .getService( Components.interfaces.nsIIOService )
			  .newFileURI( stylesFile )
			  .spec;
		  },

getStylesDS: function() {
		 // get styles file
		 var stylesFile = bMHPrefs.getStylesFile();
		 // get url of styles file
		 var stylesFileURL = bMHPrefs.getStylesFileURL( stylesFile );
		 // on first run after installation, rdf styles file does not exist. 
		 // cannot be saved to chrome url, but must be changeable
		 var RDF = bMHPrefs.getRDF();
		 if( ! stylesFile.exists()) {
		     RDF.GetDataSourceBlocking( "chrome://bookmarkshome/content/styles.rdf" )
			 .QueryInterface( Components.interfaces.nsIRDFRemoteDataSource )
			 .FlushTo( stylesFileURL );		      
		 }
		 // get rdf styles datasource 
		 return RDF.GetDataSourceBlocking( stylesFileURL ); 
	     },


formatSheet: function( sheet ) {
		 sheet = sheet.replace( /(\*\/)\s*/g, "$1\n" );
		 sheet = sheet.replace( /([\{;])\s*/g, "$1\n" );
		 sheet = sheet.replace( /(\})\s*/g, "$1\n\n" );
		 sheet = sheet.replace( /(.*;)/g, "    $1" );
		 return sheet;
	     },

binarySearch: function( target, array ) {
		  var found = false;
		  var first = 0, last = array.length - 1, temp, mid;
		  while (( !found ) && ( first <= last )) {
		      temp = first + last;
		      // integer division
		      mid = ( temp - ( temp % 2 )) / 2;
		      if( target == array[mid] ) {
			  found = true;
		      }
		      else if( target < array[mid] ) {
			  last = mid - 1;
		      }
		      else {
			  first = mid + 1;
		      }
		  }
		  return( found ? mid : -1 ); 
	      }, 

isExcludedFolder: function( folderString, excludeIndex, inOrExcludedFolders ) {
		      var index = bMHPrefs.binarySearch( folderString, inOrExcludedFolders ); 
		      var isInOrExcluded = ( index >= 0 );
		      var exclude = ( bMHPrefs.getPref( "excludeIndex" ) == 0 ); 
		      return ( exclude == isInOrExcluded );
		  },

openFolder: function( listId ) {
		var aList = document.getElementById( listId );
		var listLength = aList.childNodes.length;
		var link, browser, i;
		var inTabs = ( bMHPrefs.getPref( "openFolderIn" ) == 0 );
		if( inTabs ) {
		    // thanks to Neil Deakin
		    browser = window.QueryInterface( Components.interfaces.nsIInterfaceRequestor )
			.getInterface( Components.interfaces.nsIWebNavigation )
			.QueryInterface( Components.interfaces.nsIDocShellTreeItem )
			.rootTreeItem
			.QueryInterface( Components.interfaces.nsIInterfaceRequestor )
			.getInterface( Components.interfaces.nsIDOMWindow )
			.getBrowser();
		    for( i = 0; i < listLength; i++ ) { 
			link = aList.childNodes[i].childNodes[0];	
			browser.addTab( link.getAttribute( "href" ));
		    }
		}
		else {
		    // open in new windows
		    for( i = 0; i < listLength; i++ ) {
			link = aList.childNodes[i].childNodes[0];	
			window.open( link.getAttribute( "href" ));
		    }
		}
	    }
}



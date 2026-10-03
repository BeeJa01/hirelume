import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

splashContainer: {
  flex: 1,
},

splash:
  {
  width: "100%",
  height: "50%",
  justifyContent: 'center',
  flex: 1,
  alignItems: 'center'
},

text: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 20,
},

  button: {margin: 10, 
    borderColor: "aqua", 
    borderWidth: 1,
   
    borderRadius: 20,
    height: 50,
    width: '20%',
    maxWidth: '80%',
    alignSelf: 'center',
   
  },

  label: {
  color: "black",
  marginBottom: 5,
  marginLeft: 15,
  fontSize: 20
},

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'white',
    margin: 2,
    color: '#1f2937',
    fontSize: 15,
    textAlign: 'left',
  },


     view: {
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
    },


});
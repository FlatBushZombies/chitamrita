import { View, Text, StyleSheet } from 'react-native';

export default function AddScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Add Content Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    text: {
        color: 'white',
        fontSize: 16,
    },
}); 